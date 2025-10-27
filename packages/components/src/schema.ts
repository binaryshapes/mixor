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
 * Maps field names to their corresponding Value components.
 *
 * @remarks
 * This is the input type for the schema function, where each key represents a field name and each
 * value is a Value component that validates that field.
 *
 * @internal
 */
type SchemaValues = Record<string, Value<n.Any, n.Any>>;

/**
 * Infers the TypeScript type of the validated data structure from the schema values.
 *
 * @remarks
 * This type extracts the inferred types from each Value component in the schema, creating a mapped
 * type that represents the structure of validated data.
 *
 * @typeParam V - The schema values type.
 *
 * @internal
 */
type SchemaType<V extends SchemaValues> = n.Prettify<
  {
    [K in keyof V]: V[K] extends Value<infer T, n.Any> ? T : never;
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
type SchemaErrors<V extends SchemaValues, Mode extends n.ErrorMode> = n.Prettify<
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
type SchemaFunction<V extends SchemaValues> = <
  T extends SchemaType<V>,
  M extends n.ErrorMode = (typeof DEFAULT_ERROR_MODE),
>(
  value: T,
  mode?: M,
) => n.Result<T, SchemaErrors<V, M>>;

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
  'Schema',
  SchemaFunction<V>,
  SchemaValues,
  SchemaMeta<V>
>;

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

  const schemaComponent = n.component('Schema', schemaFn, { ...values });

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

export { schema };
export type { Schema };
