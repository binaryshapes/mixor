/**
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { type Component, component } from '../component';
import Config from '../config';
import type { Any, Prettify, UndefinedToOptional } from '../generics';
import { Panic } from '../panic';
import { type ApplyErrorMode, type ErrorMode, type Result, err, isOk, ok } from '../result';
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
 * @internal
 */
type SchemaValues<S> = UndefinedToOptional<{
  [K in keyof S]: S[K] extends Value<infer T, Any>
    ? // Some values are objects of values, so we need to recursively infer the object type.
      T extends Record<string, Value<Any, Any>>
      ? SchemaValues<T>
      : T
    : never;
}>;

/**
 * The type of the errors of the schema.
 * Uses the centralized error mode concept from {@link ErrorMode}.
 *
 * @typeParam S - The schema fields.
 * @typeParam Mode - The error mode.
 *
 * @internal
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
  <Mode extends ErrorMode = 'all'>(value: V, mode?: Mode): Result<V, SchemaErrors<F, Mode>>;
} & {
  [K in keyof F]: F[K] extends Value<Any, Any> ? F[K] : never;
};

/**
 * Infer the type of the schema function.
 *
 * @remarks
 * This type is usefull if you want to use the schema as a parameter of another function.
 *
 * @typeParam S - The schema component.
 *
 * @public
 */
type SchemaType<S extends Component<'Schema', Any>> =
  S extends SchemaFunction<Any, Any> ? ReturnType<S> : never;

/**
 * A schema that provides both object validation and individual field validation.
 * It follows the same pattern as Value, being both a function and an object with properties.
 *
 * @typeParam F - The schema fields type.
 *
 * @public
 */
type Schema<F> = Component<
  'Schema',
  SchemaFunction<F> & SchemaBuilder<F>,
  { example: SchemaValues<F> },
  SchemaValues<F>
>;

/**
 * Panic error for the schema module.
 *
 * @public
 */
class SchemaError extends Panic<'Schema', 'FieldIsNotValue'>('Schema') {}

/**
 * Class for building schemas. It provides all methods to create and transform schemas.
 *
 * @param fields - The schema fields.
 * @returns The schema prototype.
 *
 * @internal
 */
class SchemaBuilder<F> {
  private constructor(public readonly fields: EnsureAllValues<F>) {}

  /**
   * Types of the schema.
   *
   * @remarks
   * Useful for introspection and debugging in runtime.
   *
   * This types are obtained from the component info (`value.info.subType`)
   * and the rules (`value.rules.map((r) => r.info.subType)`).
   *
   * @returns An object with the fields and their types.
   */
  public get types() {
    return Object.fromEntries(
      Object.entries(this.fields).map(([key, field]) => {
        const value = field as Value<Any, Any>;
        let subType = value.info.subType ?? 'unknown';

        // If the subType is unknown in the value, we check the rules to find the
        // first non-unknown subType.
        if (subType === 'unknown') {
          const ruleTypes = value.rules.map((r) => r.info.subType).filter(Boolean) as string[];
          subType = ruleTypes.length > 0 ? ruleTypes[0] : 'unknown';
        }

        return [key, subType];
      }),
    ) as Prettify<Record<keyof F, string>>;
  }

  /**
   * Creates a new schema with only the specified fields.
   *
   * @param keys - Object with keys to pick (values should be true).
   * @returns A new schema with only the picked fields.
   */
  public pick(keys: Partial<Record<keyof F, true>>) {
    return SchemaBuilder.create(
      Object.fromEntries(
        Object.entries(keys)
          .filter(([, shouldPick]) => shouldPick)
          .map(([key]) => [key, (this.fields as Any)[key]]),
      ),
    ) as unknown as Schema<PickSchema<F, keyof F>>;
  }

  /**
   * Creates a new schema with the specified fields removed.
   *
   * @param keys - Object with keys to omit (values should be true).
   * @returns A new schema with the omitted fields removed.
   */
  public omit(keys: Record<keyof F, true>) {
    return SchemaBuilder.create(
      Object.fromEntries(
        Object.entries(this.fields).filter(
          ([key]) => !(key in keys) || !keys[key as keyof typeof keys],
        ),
      ) as Any,
    ) as unknown as Schema<OmitSchema<F, keyof F>>;
  }

  /**
   * Creates a new schema with all fields made optional.
   *
   * @returns A new schema with all fields optional.
   */
  public partial() {
    return SchemaBuilder.create(
      Object.fromEntries(
        Object.entries(this.fields).map(([key, field]) => [
          key,
          (field as Any).optional(),
        ]),
      ),
    ) as unknown as Schema<PartialSchema<F>>;
  }

  /**
   * Extends the schema with additional fields.
   *
   * @param additionalFields - Additional fields to add to the schema.
   * @returns A new schema with the extended fields.
   */
  public extend<E extends SchemaFields>(additionalFields: EnsureAllValues<E>) {
    return SchemaBuilder.create({
      ...(this.fields as Any),
      ...(additionalFields as Any),
    }) as unknown as Schema<ExtendSchema<F, E>>;
  }

  /**
   * Creates a new schema as a component.
   *
   * @param fields - The schema fields.
   * @returns A new schema.
   */
  static create<F extends SchemaFields>(fields: EnsureAllValues<F>): Schema<F> {
    // Validate that all fields are values during schema creation.
    if (
      Object.values(fields).some((f) => {
        return !isValue(f);
      })
    ) {
      throw new SchemaError('FieldIsNotValue', 'All fields must be values.');
    }

    // Create the main schema validation function.
    const schemaFn = (value: SchemaValues<F>, mode = Config.defaultFailureMode) => {
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

    // Create a schema builder as a component.
    const schemaBuilder = new SchemaBuilder(fields);

    // Add to the schema function the schema builder as a prototype.
    const baseSchema = component('Schema', Object.setPrototypeOf(schemaFn, schemaBuilder), fields);

    // Add field functions as properties to the schema function.
    for (const [fieldName, fieldFn] of Object.entries(fields)) {
      Object.defineProperty(baseSchema, fieldName, {
        value: fieldFn,
        writable: false,
        enumerable: true,
      });

      // Adding field value as a child of the schema component.
      baseSchema.addChildren(fieldFn);
    }

    return baseSchema as Schema<F>;
  }
}

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
const schema = <F extends SchemaFields>(fields: EnsureAllValues<F>): Schema<F> =>
  SchemaBuilder.create(fields);

export { SchemaError, schema };
export type { Schema, SchemaType };
