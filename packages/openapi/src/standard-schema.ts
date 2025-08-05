/*
 * This file is part of the Mixor project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { StandardSchemaV1 } from '@standard-schema/spec';

import type { Result, Schema, SchemaValues } from '@mixor/core';
import { isOk } from '@mixor/core';

/**
 * Converts a Mixor Result to a Standard Schema Result.
 *
 * @typeParam T - The type of the successful value.
 * @param result - The Mixor result to convert.
 * @returns A Standard Schema result.
 *
 * @internal
 */
const convertResult = <T, E>(result: Result<T, E>): StandardSchemaV1.Result<T> => {
  if (isOk(result)) {
    return { value: result.value };
  }

  // Convert Mixor error to Standard Schema issues
  const error = result.error;
  const issues: StandardSchemaV1.Issue[] = [];

  if (typeof error === 'string') {
    // Simple string error
    issues.push({ message: error });
  } else if (Array.isArray(error)) {
    // Array of errors - convert each error to an issue
    for (const err of error) {
      issues.push({
        message: typeof err === 'string' ? err : String(err),
      });
    }
  } else if (typeof error === 'object' && error !== null) {
    // Object error - convert each field to an issue
    for (const [field, fieldError] of Object.entries(error)) {
      if (Array.isArray(fieldError)) {
        // Array of errors for a field
        for (const err of fieldError) {
          if (Array.isArray(err)) {
            // Nested array of errors (Mixor schema creates this structure)
            for (const nestedErr of err) {
              issues.push({
                message: typeof nestedErr === 'string' ? nestedErr : String(nestedErr),
                path: [field],
              });
            }
          } else {
            // Single error in array
            issues.push({
              message: typeof err === 'string' ? err : String(err),
              path: [field],
            });
          }
        }
      } else {
        // Single error for a field
        issues.push({
          message: typeof fieldError === 'string' ? fieldError : String(fieldError),
          path: [field],
        });
      }
    }
  } else {
    // Fallback for other error types
    issues.push({ message: String(error) });
  }

  return { issues };
};

/**
 * Converts a Mixor Schema to a Standard Schema.
 *
 * @typeParam F - The schema fields type.
 * @param schema - The Mixor schema to convert.
 * @returns A Standard Schema compatible object.
 *
 * @example
 * ```ts
 * // standard-schema-001: Basic schema conversion.
 * const UserSchema = schema({
 *   name: value(rule((name: string) => name.length > 0 ? ok(name) : err('EMPTY_NAME'))),
 *   age: value(rule((age: number) => age >= 0 ? ok(age) : err('INVALID_AGE')))
 * });
 *
 * const standardUserSchema = toStandardSchema(UserSchema);
 * const result = standardUserSchema['~standard'].validate({ name: 'John', age: 30 });
 * // result: { value: { name: 'John', age: 30 } }.
 * ```
 *
 * @example
 * ```ts
 * // standard-schema-002: Error handling with Standard Schema.
 * const UserSchema = schema({
 *   name: value(rule((name: string) => name.length > 0 ? ok(name) : err('EMPTY_NAME'))),
 *   age: value(rule((age: number) => age >= 0 ? ok(age) : err('INVALID_AGE')))
 * });
 *
 * const standardUserSchema = toStandardSchema(UserSchema);
 * const result = standardUserSchema['~standard'].validate({ name: '', age: -5 });
 * // result: { issues: [{ message: 'EMPTY_NAME', path: ['name'] }, { message: 'INVALID_AGE', path: ['age'] }] }.
 * ```
 *
 * @public
 */
const toStandardSchema = <F>(schema: Schema<F>): StandardSchemaV1<SchemaValues<F>> => {
  return {
    '~standard': {
      version: 1,
      vendor: 'mixor',
      validate: (value: unknown): StandardSchemaV1.Result<SchemaValues<F>> => {
        // Use the Mixor schema to validate the input
        const result = schema(value as SchemaValues<F>);
        // Standard Schema allows both sync and async validation.
        // Since Mixor schema validation is synchronous, we return the result directly.
        return convertResult(result);
      },
      types: {
        input: {} as SchemaValues<F>,
        output: {} as SchemaValues<F>,
      },
    },
  };
};

/**
 * Type guard to check if a Standard Schema result has issues.
 *
 * @param result - The Standard Schema result to check.
 * @returns True if the result has issues, false otherwise.
 *
 * @public
 */
const hasIssues = <T>(
  result: StandardSchemaV1.Result<T> | Promise<StandardSchemaV1.Result<T>>,
): result is StandardSchemaV1.FailureResult => {
  return !(result instanceof Promise) && 'issues' in result;
};

/**
 * Type guard to check if a Standard Schema result has a value.
 *
 * @param result - The Standard Schema result to check.
 * @returns True if the result has a value, false otherwise.
 *
 * @public
 */
const hasValue = <T>(
  result: StandardSchemaV1.Result<T> | Promise<StandardSchemaV1.Result<T>>,
): result is StandardSchemaV1.SuccessResult<T> => {
  return !(result instanceof Promise) && 'value' in result;
};

export { toStandardSchema, hasIssues, hasValue };
