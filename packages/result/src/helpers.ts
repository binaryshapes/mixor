/*
 * This file is part of the Daikit project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { Result } from './result';
import { fail } from './result';

/**
 * Represents a value that has been bound to a key in the pipeline.
 * This type is used internally to track bound values and their types.
 *
 * @template T - The type of the value being bound
 *
 * @example
 * ```ts
 * const boundValue: BindValue<{ name: string }> = {
 *   __bind: true,
 *   value: { name: "John" }
 * };
 * ```
 */
export type BindValue<T> = {
  __bind: true;
  value: T;
};

/**
 * Flattens an intersection type to make it more readable and usable.
 * This is particularly useful when dealing with complex type intersections.
 *
 * @template T - The type to flatten
 *
 * @example
 * ```ts
 * type A = { a: string } & { b: number };
 * type B = FlattenIntersection<A>; // { a: string; b: number }
 * ```
 */
type FlattenIntersection<T> = T extends infer U ? { [K in keyof U]: U[K] } : never;

/**
 * Extracts the actual value type from a BindValue type.
 * If the type is not a BindValue, returns the type as is.
 *
 * @template S - The source type to extract from
 *
 * @example
 * ```ts
 * type A = BindValue<{ name: string }>;
 * type B = ExtractBindValueType<A>; // { name: string }
 *
 * type C = string;
 * type D = ExtractBindValueType<C>; // string
 * ```
 */
type ExtractBindValueType<S> = S extends BindValue<infer T> ? FlattenIntersection<T> : S;

/**
 * Merges a new key-value pair into an existing BindValue type.
 * If the source is not a BindValue, creates a new type with just the new key-value pair.
 *
 * @template S - The source type
 * @template K - The key to add
 * @template T - The type of the value to add
 *
 * @example
 * ```ts
 * type A = BindValue<{ name: string }>;
 * type B = MergeBindValueType<A, "age", number>; // { name: string; age: number }
 *
 * type C = string;
 * type D = MergeBindValueType<C, "age", number>; // { age: number }
 * ```
 */
type MergeBindValueType<S, K extends string, T> =
  S extends BindValue<infer U> ? U & { [P in K]: T } : { [P in K]: T };

/**
 * Helper function to handle both synchronous and asynchronous operations on a Result.
 * This function ensures consistent handling of Results whether they are Promises or not.
 *
 * @template S - The success type
 * @template F - The failure type
 * @template NS - The new success type
 * @template NF - The new failure type
 *
 * @param result - The Result to handle, which can be a Promise or direct Result
 * @param handler - The function to handle the Result
 * @returns A Promise that resolves to the new Result
 *
 * @example
 * ```ts
 * const result = success("hello");
 * const newResult = await handleResult(
 *   result,
 *   (r) => success(r.isValue.toUpperCase())
 * );
 * // newResult.isValue === "HELLO"
 * ```
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
 * @template S - The type of the value to extract
 * @param value - The value to extract from
 * @returns The extracted value
 *
 * @example
 * ```ts
 * const value = { __bind: true, value: { name: "John" } };
 * const extracted = extractValue(value); // { name: "John" }
 *
 * const simpleValue = "hello";
 * const extractedSimple = extractValue(simpleValue); // "hello"
 * ```
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
 * @param value - The value to check
 * @returns True if the value is a BindValue, false otherwise
 *
 * @example
 * ```ts
 * const value = { __bind: true, value: { name: "John" } };
 * if (isBindValue(value)) {
 *   // value is now typed as BindValue<unknown>
 *   console.log(value.value);
 * }
 * ```
 */
function isBindValue(value: unknown): value is BindValue<unknown> {
  return typeof value === 'object' && value !== null && '__bind' in value && 'value' in value;
}

/**
 * Creates a new BindValue.
 * This function wraps a value in a BindValue structure.
 *
 * @template T - The type of the value to bind
 * @param value - The value to bind
 * @returns A new BindValue containing the provided value
 *
 * @example
 * ```ts
 * const boundValue = createBindValue({ name: "John" });
 * // boundValue = { __bind: true, value: { name: "John" } }
 * ```
 */
function createBindValue<T>(value: T): BindValue<T> {
  return { __bind: true, value };
}

/**
 * Merges multiple bind values into a single object.
 * This function is used internally to combine bound values in the pipeline.
 *
 * @template T - The type of the resulting object
 * @param currentValue - The current object to merge into
 * @param newKey - The key to add
 * @param newValue - The value to add
 * @returns A new object with the merged values
 *
 * @example
 * ```ts
 * const current = { name: "John" };
 * const merged = mergeBindValues(current, "age", 30);
 * // merged = { name: "John", age: 30 }
 * ```
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
 * @template S - The success type
 * @template F - The failure type
 * @template NS - The new success type
 * @template NF - The new failure type
 *
 * @param operator - The operator function to make error-safe
 * @param errorHandler - The function to handle any errors
 * @returns A new function that wraps the operator in error handling
 *
 * @example
 * ```ts
 * const safeOperator = errorSafe(
 *   async (result) => {
 *     // This might throw
 *     const value = await someAsyncOperation(result.isValue);
 *     return success(value);
 *   },
 *   (error) => `Operation failed: ${error}`
 * );
 * ```
 */
function errorSafe<S, F, NS, NF>(
  operator: (result: Result<S, F>) => Promise<Result<NS, NF>>,
  errorHandler: (error: unknown) => NF,
): (result: Result<S, F>) => Promise<Result<NS, NF>> {
  return async (result: Result<S, F>) => {
    try {
      return await operator(result);
    } catch (error) {
      return fail(errorHandler(error));
    }
  };
}

export { handleResult, extractValue, isBindValue, createBindValue, mergeBindValues, errorSafe };
export type { ExtractBindValueType, MergeBindValueType };
