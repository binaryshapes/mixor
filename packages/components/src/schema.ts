/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { n } from '@nuxo/core';

import { DEFAULT_ERROR_MODE } from './constants.ts';
import type { Value } from './value.ts';

/**
 * The tag for the schema component.
 *
 * @internal
 */
const SCHEMA_TAG = 'Schema' as const;

/**
 * Maps field names to their corresponding {@link Value} components.
 *
 * @remarks
 * This is the input type for the schema function, where each key represents a field name and each
 * value is a Value component that validates that field.
 *
 * @internal
 */
type SchemaValues = Record<string, Value<n.Any, n.Any, boolean>>;

/**
 * Infers the TypeScript type of the validated data structure from the schema values.
 *
 * @remarks
 * This type extracts the inferred types from each Value component in the schema, creating a mapped
 * type that represents the structure of validated data. Fields that include undefined are marked as
 * optional, maintaining the original property order.
 *
 * @typeParam V - The schema values type.
 *
 * @internal
 */
type SchemaType<V extends SchemaValues> = n.UndefToOptional<
  {
    [K in keyof V]: V[K]['Type'];
  }
>;

/**
 * Infers the error type structure based on the schema values and validation mode.
 *
 * @remarks
 * This type extracts the error types from each Value component in the schema, creating a mapped
 * type that represents the structure of validation errors. The error format depends on the
 * validation mode ('strict' or 'all').
 *
 * @typeParam V - The schema values type.
 * @typeParam Mode - The error mode ('strict' or 'all').
 *
 * @internal
 */
type SchemaErrors<V extends SchemaValues, Mode extends n.ErrorMode> = n.Pretty<
  {
    [K in keyof V]: V[K] extends Value<n.Any, infer E> ? n.ApplyErrorMode<E, Mode> : never;
  }
>;

/**
 * Metadata structure for schema components.
 *
 * @remarks
 * Stores additional information about the schema, such as example valid data  structures that
 * match the schema.
 *
 * @typeParam V - The schema values type.
 *
 * @internal
 */
type SchemaMeta<V extends SchemaValues> = {
  /**
   * The example valid data structures that match the schema.
   */
  examples: SchemaType<V>[];
};

/**
 * Function signature for schema validation.
 *
 * @remarks
 * A generic validation function that accepts a value to validate and an optional validation mode.
 * The function validates the input against all value components in the schema and returns a
 * Result with either the validated data or errors.
 *
 * @typeParam V - The schema values type.
 *
 * @internal
 */
type SchemaFunction<V extends SchemaValues, T = SchemaType<V>> = <
  M extends n.ErrorMode = (typeof DEFAULT_ERROR_MODE),
>(
  value: T,
  mode?: M,
) => n.Result<T, SchemaErrors<V, M>>;

/**
 * Pick schema type.
 *
 * @typeParam V - The schema values type.
 * @typeParam Picked - The keys to pick from the schema.
 *
 * @internal
 */
type PickSchema<V extends SchemaValues, Picked extends keyof V> = n.Pretty<
  {
    [K in Picked]: V[K];
  }
>;

/**
 * Omit schema type.
 *
 * @typeParam V - The schema values type.
 * @typeParam Omitted - The keys to omit from the schema.
 *
 * @internal
 */
type OmitSchema<V extends SchemaValues, Omitted extends keyof V> = n.Pretty<
  {
    [K in keyof V as K extends Omitted ? never : K]: V[K];
  }
>;

/**
 * Extends the schema with additional values.
 *
 * @typeParam V - The original schema values.
 * @typeParam A - The additional values to extend with.
 *
 * @internal
 */
type ExtendSchema<V extends SchemaValues, A extends SchemaValues> = n.Pretty<V & A>;

/**
 * Partial schema type, all values are optional.
 *
 * @typeParam V - The schema values type.
 *
 * @internal
 */
type PartialSchema<V extends SchemaValues> = n.Pretty<
  {
    [K in keyof V]: V[K] extends Value<infer T, infer E> ? Value<T | undefined, E, false>
      : never;
  }
>;

/**
 * Required schema type, all values are required.
 *
 * @typeParam V - The schema values type.
 *
 * @internal
 */
type RequiredSchema<V extends SchemaValues> = n.Pretty<
  {
    [K in keyof V]: V[K] extends Value<infer T, infer E> ? Value<T, E, true>
      : never;
  }
>;

/**
 * The schema component type.
 *
 * @remarks
 * A component that wraps a schema validation function with its associated values and metadata.
 * The schema component can be used to validate complex object structures against defined
 * value validators.
 *
 * @typeParam V - The schema values type.
 *
 * @public
 */
type Schema<V extends SchemaValues> = n.Component<
  typeof SCHEMA_TAG,
  SchemaFunction<V> & SchemaBuilder<V>,
  SchemaType<V>,
  SchemaMeta<V>
>;

/**
 * Panic error for the schema module.
 *
 * - `AtLeastOneKeyRequired`: At least one key must be provided to pick values from the schema.
 * - `InvalidKey`: The key is not a valid value in the schema.
 *
 * @public
 */
class SchemaPanic extends n.panic<
  typeof SCHEMA_TAG,
  'AtLeastOneKeyRequired' | 'InvalidKey'
>(SCHEMA_TAG) {}

/**
 * Schema component builder class which provides a method to pick values from the schema.
 *
 * @typeParam V - The schema values type.
 *
 * @internal
 */
class SchemaBuilder<V extends SchemaValues> {
  constructor(private values: V) {}
  /**
   * Validates the keys of the schema.
   *
   * @remarks
   * This method validates that at least one key is provided to pick values from the schema, and
   * that all keys are valid.
   *
   * @param values - The keys to pick from the schema, and at least one key must be provided.
   *
   * @internal
   */
  private validateKeys(values: SchemaValues) {
    // Runtime assertion check that at least one key must be provided.
    if (Object.keys(values).length === 0) {
      throw new SchemaPanic(
        'AtLeastOneKeyRequired',
        'At least one key must be provided to pick values from the schema.',
        `Valid keys are: ${Object.keys(this.values).join(', ')}`,
      );
    }

    // Runtime assertion check that all keys are valid.
    for (const key of Object.keys(values)) {
      if (!(key in this.values)) {
        throw new SchemaPanic(
          'InvalidKey',
          `Key "${key}" is not a valid value in the schema`,
          `Valid keys are: ${Object.keys(this.values).join(', ')}`,
        );
      }
    }
  }

  /**
   * Creates a new schema with only the specified values.
   *
   * @param values - Object with keys to pick, at least one key must be provided.
   * @returns A new schema with only the picked values.
   */
  public pick<Picked extends keyof V>(values: n.RequireAtLeastOne<Record<Picked, true>>) {
    this.validateKeys(values);

    // Initialize a new schema with the picked values.
    const pickedValues = Object.fromEntries(
      Object.entries(values)
        .filter(([, shouldPick]) => shouldPick)
        .map(([key]) => [key, this.values[key]]),
    );

    return schema(pickedValues) as unknown as Schema<PickSchema<V, Picked>>;
  }

  /**
   * Creates a new schema with the specified values omitted.
   *
   * @param values - Object with keys to omit, at least one key must be provided.
   * @returns A new schema with the omitted values.
   */
  public omit<Omitted extends keyof V>(values: n.RequireAtLeastOne<Record<Omitted, true>>) {
    this.validateKeys(values);

    // Initialize a new schema with the omitted values.
    const omittedValues = Object.fromEntries(
      Object.entries(this.values)
        .filter(([key]) => !(key in values) || !values[key as keyof typeof values]),
    );

    return schema(omittedValues) as unknown as Schema<OmitSchema<V, Omitted>>;
  }

  /**
   * Extends the schema with additional values.
   *
   * @param additionalValues - The additional values to extend with.
   * @returns A new schema with the additional values.
   */
  public extend<A extends SchemaValues>(additionalValues: A) {
    return schema({
      ...this.values,
      ...additionalValues,
    }) as unknown as Schema<ExtendSchema<V, A>>;
  }

  /**
   * Creates a new schema with all values optional.
   *
   * @returns A new schema with all values optional.
   */
  public partial() {
    return schema(Object.fromEntries(
      Object.entries(this.values).map(([key, value]) => [key, value.optional()]),
    )) as unknown as Schema<PartialSchema<V>>;
  }

  /**
   * Creates a new schema with all values required.
   *
   * @returns A new schema with all values required.
   */
  public required() {
    return schema(Object.fromEntries(
      Object.entries(this.values).map(([key, value]) => [key, value.required()]),
    )) as unknown as Schema<RequiredSchema<V>>;
  }
}

/**
 * Creates a new schema component.
 *
 * A schema is a collection of values that can be validated together. It provides
 * a structured way to validate complex objects by defining individual value validators
 * for each field.
 *
 * @remarks
 * - Supports two validation modes: 'strict' (stops at first error) and 'all' (collects all errors).
 * - Automatically constructs error objects based on the validation mode.
 * - Type-safe validation with inferred types from the value definitions.
 *
 * @typeParam V - The schema values type, which must be a record of Value components.
 * @param values - A record where each key is a field name and each value is a Value component.
 * @returns A schema component that can be used to validate objects matching the schema structure.
 */
const schema = <V extends SchemaValues>(values: V) => {
  const schemaFn: SchemaFunction<V> = <
    T extends SchemaType<V>,
    M extends n.ErrorMode = typeof DEFAULT_ERROR_MODE,
  >(value: T, mode: M = DEFAULT_ERROR_MODE as M) => {
    // Strict mode: Useful when you want to fail fast and don't need all validation errors.
    if (mode === 'strict') {
      const result = {} as Record<string, n.Any>;

      // Validate each field in the schema sequentially.
      for (const fieldName of Object.keys(values)) {
        const fieldFn = values[fieldName];
        const fieldResult = fieldFn(value[fieldName as keyof typeof value], mode);

        if (n.isOk(fieldResult)) {
          // Field validation succeeded, add it to the result object.
          result[fieldName] = fieldResult.value;
        } else {
          // Field validation failed, return error immediately (strict mode).
          return n.err({ [fieldName]: fieldResult.error }) as n.Result<T, SchemaErrors<V, M>>;
        }
      }

      // All fields validated successfully.
      return n.ok(result as T);
    }

    // All mode: Collect all errors, more complete error reporting.
    const { result, errors, hasErrors } = Object.keys(values).reduce(
      (acc, fieldName) => {
        const fieldFn = values[fieldName];
        const fieldResult = fieldFn(value[fieldName as keyof typeof value], mode);

        if (n.isOk(fieldResult)) {
          // Field validation succeeded, add it to the result object.
          acc.result[fieldName] = fieldResult.value;
        } else {
          // Field validation failed, accumulate the error.
          acc.errors[fieldName] = fieldResult.error;
          acc.hasErrors = true;
        }

        return acc;
      },
      {
        result: {} as Record<string, n.Any>,
        errors: {} as Record<string, n.Any>,
        hasErrors: false,
      },
    );

    // Return errors if any validation failed, otherwise return the validated result.
    return hasErrors ? n.err(errors) as n.Result<T, SchemaErrors<V, M>> : n.ok(result as T);
  };

  // Initialize the schema builder and create the schema component.
  const schemaBuilder = new SchemaBuilder(values);
  const schemaComponent = n.component(SCHEMA_TAG, schemaFn, schemaBuilder, { ...values });

  // Auto infer the schema type from the values.
  const schemaType = Object.fromEntries(
    Object.entries(values).map(([key, fn]) => [key, n.info(fn).props.type as string]),
  );

  // Add the schema type to the schema component.
  n.info(schemaComponent).type(schemaType);

  // Add the schema parameters to the schema (category: function).
  n.info(schemaComponent).params(['input', schemaType]);

  // Adding the values as children of the schema component.
  n.meta(schemaComponent).children(...Object.values(values));

  // Adding the schema as a referenced object of the values.
  for (const v of Object.values(values)) {
    n.info(v).refs(schemaComponent);
  }

  return schemaComponent as Schema<V>;
};

/**
 * Type guard function to check if a object is a schema component.
 *
 * @param maybeSchema - The object to check.
 * @returns True if the object is a schema, false otherwise.
 *
 * @public
 */
const isSchema = (maybeSchema: n.Any): maybeSchema is Schema<n.Any> =>
  n.isComponent(maybeSchema, SCHEMA_TAG);

export { isSchema, schema };
export type { Schema };
