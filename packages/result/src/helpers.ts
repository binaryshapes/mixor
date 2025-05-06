/*
 * This file is part of the Daikit project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { Result } from './result';
import { failure, isFail, isSuccess } from './result';

/**
 * Flattens an intersection type to make it more readable and usable.
 * This is particularly useful when dealing with complex type intersections.
 *
 * @typeParam T - The type to flatten.
 *
 * @internal
 */
type FlattenIntersection<T> = T extends infer U ? { [K in keyof U]: U[K] } : never;

/**
 * Represents a value that has been bound to a key in the pipeline.
 * This type is used internally to track bound values and their types.
 *
 * @typeParam T - The type of the value being bound.
 *
 * @public
 */
type BindValue<T> = {
  __bind: true;
  value: T;
};

/**
 * Extracts the actual value type from a BindValue type.
 * If the type is not a BindValue, returns the type as is.
 *
 * @typeParam S - The source type to extract from.
 *
 * @public
 */
type ExtractBindValueType<S> = S extends BindValue<infer T> ? FlattenIntersection<T> : S;

/**
 * Merges a new key-value pair into an existing BindValue type.
 * If the source is not a BindValue, creates a new type with just the new key-value pair.
 *
 * @typeParam S - The source type.
 * @typeParam K - The key to add.
 * @typeParam T - The type of the value to add.
 *
 * @public
 */
type MergeBindValueType<S, K extends string, T> =
  S extends BindValue<infer U> ? U & { [P in K]: T } : { [P in K]: T };

/**
 * Helper function to handle both synchronous and asynchronous operations on a Result.
 * This function ensures consistent handling of Results whether they are Promises or not.
 *
 * @typeParam S - The success type.
 * @typeParam F - The failure type.
 * @typeParam NS - The new success type.
 * @typeParam NF - The new failure type.
 *
 * @param result - The Result to handle, which can be a Promise or direct Result.
 * @param handler - The function to handle the Result.
 * @returns A Promise that resolves to the new Result.
 *
 * @public
 */
function handleResult<S, F, NS, NF>(
  result: Result<S, F> | Promise<Result<S, F>>,
  handler: (r: Result<S, F>) => Result<NS, NF> | Promise<Result<NS, NF>>,
): Promise<Result<NS, NF>> {
  return result instanceof Promise ? result.then(handler) : Promise.resolve(handler(result));
}

/**
 * Extracts the value from a Result, handling BindValue cases.
 * This function is used internally to get the actual value from a Result,
 * whether it's wrapped in a BindValue or not.
 *
 * @typeParam S - The type of the value to extract.
 * @param value - The value to extract from.
 * @returns The extracted value.
 *
 * @public
 */
function extractValue<S>(value: S): ExtractBindValueType<S> {
  if (typeof value === 'object' && value !== null && 'value' in value) {
    return value.value as ExtractBindValueType<S>;
  }
  return value as ExtractBindValueType<S>;
}

/**
 * Checks if a value is a BindValue.
 * This is a type guard function that can be used to narrow down types.
 *
 * @param value - The value to check.
 * @returns True if the value is a BindValue, false otherwise.
 *
 * @public
 */
function isBindValue(value: unknown): value is BindValue<unknown> {
  return typeof value === 'object' && value !== null && '__bind' in value && 'value' in value;
}

/**
 * Creates a new BindValue.
 * This function wraps a value in a BindValue structure.
 *
 * @typeParam T - The type of the value to bind.
 * @param value - The value to bind.
 * @returns A new BindValue containing the provided value.
 *
 * @public
 */
function createBindValue<T>(value: T): BindValue<T> {
  return { __bind: true, value };
}

/**
 * Merges multiple bind values into a single object.
 * This function is used internally to combine bound values in the pipeline.
 *
 * @typeParam T - The type of the resulting object.
 * @param currentValue - The current object to merge into.
 * @param newKey - The key to add.
 * @param newValue - The value to add.
 * @returns A new object with the merged values.
 *
 * @public
 */
function mergeBindValues<T extends Record<string, unknown>>(
  currentValue: Partial<T> | undefined,
  newKey: string,
  newValue: unknown,
): T {
  return {
    ...(currentValue || {}),
    [newKey]: newValue,
  } as T;
}

/**
 * Makes any pipeline operator error-safe by wrapping it in a try-catch block.
 * This function ensures that any errors in the pipeline are properly caught and converted to failures.
 *
 * @typeParam S - The success type.
 * @typeParam F - The failure type.
 * @typeParam NS - The new success type.
 * @typeParam NF - The new failure type.
 *
 * @param operator - The operator function to make error-safe.
 * @param errorHandler - The function to handle any errors.
 * @returns A new function that wraps the operator in error handling.
 *
 * @public
 */
function errorSafe<S, F, NS, NF>(
  operator: (result: Result<S, F>) => Promise<Result<NS, NF>>,
  errorHandler: (error: unknown) => NF,
): (result: Result<S, F>) => Promise<Result<NS, NF>> {
  return async (result: Result<S, F>) => {
    try {
      return await operator(result);
    } catch (error) {
      return failure(errorHandler(error));
    }
  };
}

/**
 * Type guard to check if a result is a failure of type F or F2.
 *
 * @typeParam F - The failure value type.
 * @typeParam F2 - The second failure value type.
 * @param result - The result that needs to be checked.
 * @returns True if the result is a failure of type F or F2, false otherwise.
 *
 * @public
 */
function isFailureOfType<F, F2>(result: Result<unknown, F | F2>): result is Result<never, F | F2> {
  return isFail(result);
}

/**
 * Type guard to check if a result is a success of type S or T2.
 *
 * @typeParam S - The success value type.
 * @typeParam T2 - The second success value type.
 * @param result - The result that needs to be checked.
 * @returns True if the result is a success of type S or T2, false otherwise.
 *
 * @public
 */
function isSuccessOfType<S, T2>(
  result: Result<S | T2, unknown>,
): result is { value: S | T2; _isSuccess: true } {
  return isSuccess(result);
}

export type { BindValue, ExtractBindValueType, MergeBindValueType };
export {
  handleResult,
  extractValue,
  isBindValue,
  createBindValue,
  mergeBindValues,
  errorSafe,
  isFailureOfType,
  isSuccessOfType,
};
