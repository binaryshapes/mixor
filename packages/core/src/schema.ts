/*
 * This file is part of the Mixor project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { config } from './_config';
import type { ApplyErrorMode, ErrorMode } from './_err';
import { type Component, component, isComponent } from './component';
import type { Any, Prettify, UndefinedToOptional } from './generics';
import { panic } from './panic';
import { type Result, err, isOk, ok } from './result';
import { type Value, isValue } from './value';

/**
 * A schema is a record of field names and their corresponding validation functions.
 *
 * @internal
 */
type SchemaFields = Record<string, Value<Any, Any>>;

/**
 * Type constraint to ensure all properties in a record are Value types.
 * This preserves type inference while enforcing the constraint.
 *
 * @typeParam T - The record type to validate.
 *
 * @internal
 */
type EnsureAllValues<T> = Prettify<{
  [K in keyof T]: T[K] extends Value<Any, Any> ? T[K] : never;
}>;

/**
 * The type of the values of the schema.
 *
 * @typeParam S - The schema fields.
 *
 * @public
 */
type SchemaValues<S> = UndefinedToOptional<{
  [K in keyof S]: S[K] extends Value<infer T, Any> ? T : never;
}>;

/**
 * The type of the errors of the schema.
 * Uses the centralized error mode concept from {@link ErrorMode}.
 *
 * @typeParam S - The schema fields.
 * @typeParam Mode - The error mode.
 *
 * @public
 */
type SchemaErrors<S, Mode extends ErrorMode> = Prettify<{
  [K in keyof S]: S[K] extends Value<Any, infer E> ? ApplyErrorMode<E, Mode> : never;
}>;

/**
 * Creates a schema with only the picked fields.
 *
 * @typeParam S - The original schema fields.
 * @typeParam K - The keys to pick.
 *
 * @internal
 */
type PickSchema<S, K extends keyof S> = Prettify<{
  [P in K]: S[P];
}>;

/**
 * Creates a schema with the omitted fields removed.
 *
 * @typeParam S - The original schema fields.
 * @typeParam K - The keys to omit.
 *
 * @internal
 */
type OmitSchema<S, K extends keyof S> = Prettify<{
  [P in keyof S as P extends K ? never : P]: S[P];
}>;

/**
 * Makes all fields in the schema optional.
 *
 * @typeParam S - The original schema fields.
 *
 * @internal
 */
type PartialSchema<S> = Prettify<{
  [K in keyof S]: S[K] extends Value<infer T, infer E> ? Value<T | undefined, E> : never;
}>;

/**
 * Extends the schema with additional fields.
 *
 * @typeParam S - The original schema fields.
 * @typeParam E - The additional fields to extend with.
 *
 * @internal
 */
type ExtendSchema<S, E extends SchemaFields> = Prettify<S & E>;

/**
 * This function ensures to executes all value validators defined in the schema.
 * The result is a record of the values and errors.
 * Uses the centralized error mode concept from {@link ErrorMode}.
 *
 * @typeParam F - The schema fields.
 * @typeParam V - The schema values.
 *
 * @internal
 */
type SchemaFunction<F, V = SchemaValues<F>> = {
  /**
   * Validates the schema with the given value and optional error mode.
   *
   * @remarks
   * - `'strict'`: Stops at the first error and returns the error.
   * - `'all'`: Collects all errors and returns an object with the details of each field error.
   * Use the {@link config.defaultErrorMode} to set the default error mode.
   *
   * @param value - The value to validate.
   * @param mode - The error mode to use for validation.
   * @returns A result containing the validated value or an error.
   */
  <Mode extends ErrorMode = 'all'>(value: V, mode?: Mode): Result<V, SchemaErrors<F, Mode>>;

  /**
   * Creates a new schema with only the specified fields.
   *
   * @param keys - Object with keys to pick (values should be true).
   * @returns A new schema with only the picked fields.
   */
  pick<K extends keyof F>(keys: Record<K, true>): Schema<PickSchema<F, K>>;

  /**
   * Creates a new schema with the specified fields removed.
   *
   * @param keys - Object with keys to omit (values should be true).
   * @returns A new schema with the omitted fields removed.
   */
  omit<K extends keyof F>(keys: Record<K, true>): Schema<OmitSchema<F, K>>;

  /**
   * Creates a new schema with all fields made optional.
   *
   * @returns A new schema with all fields optional.
   */
  partial(): Schema<PartialSchema<F>>;

  /**
   * Extends the schema with additional fields.
   *
   * @param additionalFields - Additional fields to add to the schema.
   * @returns A new schema with the extended fields.
   */
  extend<E extends SchemaFields>(additionalFields: EnsureAllValues<E>): Schema<ExtendSchema<F, E>>;
} & {
  [K in keyof F]: F[K] extends Value<Any, Any> ? F[K] : never;
};

/**
 * A schema that provides both object validation and individual field validation.
 * It follows the same pattern as Value, being both a function and an object with properties.
 *
 * @typeParam F - The schema fields type.
 *
 * @public
 */
type Schema<F> = Component<'Schema', SchemaFunction<F>>;

/**
 * Prototype for the schema object that provides the schema transformation methods.
 *
 * @param fields - The schema fields.
 * @returns The schema prototype.
 *
 * @internal
 */
const SchemaPrototype = <F>(fields: EnsureAllValues<F>) => ({
  pick: (keys: Record<keyof F, true>) =>
    schema(
      Object.fromEntries(
        Object.entries(keys)
          .filter(([, shouldPick]) => shouldPick)
          .map(([key]) => [key, (fields as Any)[key]]),
      ),
    ),

  omit: (keys: Record<keyof F, true>) =>
    schema(
      Object.fromEntries(
        Object.entries(fields).filter(([key]) => !(key in keys) || !keys[key as keyof typeof keys]),
      ) as Any,
    ),

  partial: () =>
    schema(
      Object.fromEntries(
        Object.entries(fields).map(([key, field]) => [
          key,
          (field as Any).optional(),
        ]),
      ) as Any,
    ),

  extend: <E extends SchemaFields>(additionalFields: EnsureAllValues<E>) =>
    schema({ ...(fields as Any), ...(additionalFields as Any) }),
});

/**
 * Panic error for the schema module.
 *
 * @public
 */
const SchemaError = panic<'Schema', 'FieldIsNotValue'>('Schema');

/**
 * Creates a schema from a set of fields.
 * Automatically adds the field value as a child of the schema.
 *
 * @typeParam F - The schema fields type.
 * @param fields - The schema object containing field validators.
 * @returns The schema function with field validators as properties.
 *
 * @public
 */
const schema = <F extends SchemaFields>(fields: EnsureAllValues<F>): Schema<F> => {
  // Validate that all fields are values during schema creation.
  if (
    Object.values(fields).some((f) => {
      return !isValue(f);
    })
  ) {
    throw new SchemaError('FieldIsNotValue', 'All fields must be values.');
  }

  // Create the main schema validation function.
  const schemaValidator = (value: SchemaValues<F>, mode = config.defaultErrorMode) => {
    if (mode === 'strict') {
      // Stop at first error mode - more performant for early validation.
      const result: Record<string, Any> = {};

      for (const fieldName of Object.keys(fields)) {
        const fieldFn = (fields as Record<string, Any>)[fieldName];
        const fieldResult = fieldFn(value[fieldName as keyof typeof value], mode);

        if (isOk(fieldResult)) {
          result[fieldName] = fieldResult.value;
        } else {
          // In strict mode, return immediately on first error.
          return err({ [fieldName]: fieldResult.error });
        }
      }

      return ok(result);
    } else {
      // All errors mode - collect all errors.
      const { result, errors, hasErrors } = Object.keys(fields).reduce(
        (acc, fieldName) => {
          const fieldFn = (fields as Record<string, Any>)[fieldName];
          const fieldResult = fieldFn(value[fieldName as keyof typeof value], mode);

          if (isOk(fieldResult)) {
            acc.result[fieldName] = fieldResult.value;
          } else {
            acc.errors[fieldName] = fieldResult.error;
            acc.hasErrors = true;
          }

          return acc;
        },
        {
          result: {} as Record<string, Any>,
          errors: {} as Record<string, Any>,
          hasErrors: false,
        },
      );

      return hasErrors ? err(errors) : ok(result);
    }
  };

  // Create a component schema.
  const sch = component('Schema', schemaValidator, fields) as Schema<F>;

  // Add schema transformation methods using the prototype.
  Object.assign(sch, SchemaPrototype(fields));

  // Add field functions as properties.
  for (const [fieldName, fieldFn] of Object.entries(fields)) {
    Object.defineProperty(sch, fieldName, {
      value: fieldFn,
      writable: false,
      enumerable: true,
    });

    // Adding field value as a child of the schema component.
    sch.addChildren(fieldFn as Value<Any, Any>);
  }

  return sch;
};

/**
 * Guard check to determine if the given object is a schema.
 *
 * @param maybeSchema - The object to check.
 * @returns True if the object is a schema, false otherwise.
 *
 * @public
 */
const isSchema = (maybeSchema: Any): maybeSchema is Schema<Any> =>
  isComponent(maybeSchema, 'Schema');

export type { Schema, SchemaErrors, SchemaValues };
export { schema, isSchema, SchemaError };
