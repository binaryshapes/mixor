/**
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { type Result, err, isOk, ok } from '../result';
import type { ApplyErrorMode, Component, ErrorMode } from '../system';
import { Config, Panic, component, isComponent } from '../system';
import type { Any, Prettify, UndefToOptional } from '../utils';
import { type Value, isValue } from './value';

/**
 * A nested schema fields is a record of values.
 *
 * @internal
 */
type SchemaRecord = Record<string, Value<Any, Any> | Record<string, Value<Any, Any>>>;

/**
 * A schema is a record values. Can be nested.
 *
 * @internal
 */
type SchemaFields = Record<string, Value<Any, Any> | SchemaRecord>;

/**
 * The type of the values of the schema.
 *
 * @typeParam S - The schema fields.
 *
 * @public
 */
type SchemaValues<S> = UndefToOptional<{
  [K in keyof S]: S[K] extends SchemaRecord
    ? SchemaValues<S[K]>
    : S[K] extends Value<Any, Any>
      ? S[K]['Type']
      : never;
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
type PickSchema<S, Picked extends keyof S> = Prettify<{
  [P in Picked]: S[P];
}>;

/**
 * Creates a schema with the omitted fields removed.
 *
 * @typeParam S - The original schema fields.
 * @typeParam K - The keys to omit.
 *
 * @internal
 */
type OmitSchema<S, Omitted extends keyof S> = Prettify<{
  [P in keyof S as P extends Omitted ? never : P]: S[P];
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
type ExtendSchema<S, E> = Prettify<S & E>;

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
 * A schema that provides both object validation and individual field validation.
 * It follows the same pattern as Value, being both a function and an object with properties.
 *
 * @typeParam F - The schema fields type.
 *
 * @public
 */
type Schema<F> = Component<
  'Schema',
  SchemaFunction<F> & SchemaBuilder<F> & { Error: SchemaErrors<F, 'strict' | 'all'> },
  SchemaValues<F>,
  { example: SchemaValues<F> }
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
  // Fixed name of the schema builder.
  public static name = 'Schema';

  /**
   * The fields of the schema.
   *
   * @remarks
   * This fields are used to build the schema and introspect the schema in runtime.
   */
  private readonly fields: Any;

  /**
   * Creates a new schema builder.
   *
   * @param fields - The schema fields.
   */
  private constructor(fields: F) {
    this.fields = fields;
  }

  /**
   * Types of the schema.
   *
   * @remarks
   * Useful for introspection and debugging in runtime.
   *
   * @returns An object with the fields and their types.
   */
  public get types() {
    return Object.fromEntries(
      Object.entries(this.fields).map(([key, field]) => {
        const value = field as Value<Any, Any>;
        let type = value.info.type ?? 'unknown';

        // If the type is unknown in the value, we check the rules to find the
        // first non-unknown subType.
        if (type === 'unknown') {
          const ruleTypes = value.rules.map((r) => r.info.type).filter(Boolean) as string[];
          type = ruleTypes.length > 0 ? ruleTypes[0] : 'unknown';
        }

        return [key, type];
      }),
    ) as Prettify<Record<keyof F, string>>;
  }

  /**
   * Creates a new schema with only the specified fields.
   *
   * @param keys - Object with keys to pick (values should be true).
   * @returns A new schema with only the picked fields.
   */
  public pick<Pick extends keyof F>(keys: Partial<Record<Pick, true>>) {
    return SchemaBuilder.create(
      Object.fromEntries(
        Object.entries(keys)
          .filter(([, shouldPick]) => shouldPick)
          .map(([key]) => [key, (this.fields as Any)[key]]),
      ),
    ) as unknown as Schema<PickSchema<F, Pick>>;
  }

  /**
   * Creates a new schema with the specified fields removed.
   *
   * @param keys - Object with keys to omit (values should be true).
   * @returns A new schema with the omitted fields removed.
   */
  public omit<Omit extends keyof F>(keys: Partial<Record<Omit, true>>) {
    return SchemaBuilder.create(
      Object.fromEntries(
        Object.entries(this.fields).filter(
          ([key]) => !(key in keys) || !keys[key as keyof typeof keys],
        ),
      ) as Any,
    ) as unknown as Schema<OmitSchema<F, Omit>>;
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
  public extend<E>(additionalFields: E) {
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
  static create<F extends SchemaFields>(fields: F): Schema<F> {
    // Validate that all fields are values during schema creation.
    const invalidFields = Object.keys(fields)
      .map((f) => [f, !isValue(fields[f as keyof typeof fields])])
      .filter(([, isValue]) => isValue)
      .map(([f]) => f);

    if (invalidFields.length > 0) {
      throw new SchemaError(
        'FieldIsNotValue',
        `All fields must be values, but the following fields are not: ${invalidFields.join(', ')}`,
      );
    }

    // Create the main schema validation function.
    const schemaFn = (value: SchemaValues<F>, mode = Config.defaultErrorMode) => {
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
            return err({ [fieldName]: fieldResult.error } as Any);
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

        return hasErrors ? err(errors as Any) : ok(result);
      }
    };

    // Create a schema builder as a component.
    const schemaBuilder = new SchemaBuilder(fields);

    // Add to the schema function the schema builder as a prototype.
    return component('Schema', schemaFn, schemaBuilder, fields).addChildren(
      // Adding the fields as children.
      ...Object.values(fields),
    ) as Schema<F>;
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
const schema = <F extends SchemaFields>(fields: F) => SchemaBuilder.create(fields) as Schema<F>;

/**
 * Guard function to check if the given object is a schema.
 *
 * @param maybeSchema - The object to check.
 * @returns True if the object is a schema, false otherwise.
 *
 * @public
 */
const isSchema = (maybeSchema: Any): maybeSchema is Schema<Any> =>
  isComponent(maybeSchema, 'Schema');

export { SchemaError, isSchema, schema };
export type { Schema, SchemaErrors, SchemaValues };
