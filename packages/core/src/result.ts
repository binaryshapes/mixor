/**
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * A function that returns a result.
 *
 * @typeParam T - The type of the value to validate.
 * @typeParam E - The type of the error.
 * @param value - The value to validate.
 * @returns A result containing the validated value or an error.
 */
type ResultFunction<T, E> = (value: T) => Result<T, E>;

/**
 * Represents a successful result with a value of type T.
 * This is the happy path of the Result monad.
 *
 * @typeParam T - The type of the successful value.
 *
 * @public
 */
type Ok<T> = {
  readonly _id: 'Result';
  readonly _tag: 'Ok';
  readonly value: T;
};

/**
 * Represents a failed result with an error of type E.
 * This is the error path of the Result monad.
 *
 * @typeParam E - The type of the error.
 *
 * @public
 */
type Err<E> = {
  readonly _id: 'Result';
  readonly _tag: 'Err';
  readonly error: E;
};

/**
 * Represents a result that can be either successful (Ok) or failed (Err).
 * This is a discriminated union type that allows for type-safe error handling.
 *
 * @typeParam T - The type of the successful value.
 * @typeParam E - The type of the error.
 *
 * @public
 */
type Result<T, E> = Ok<T> | Err<E>;

/**
 * Creates a successful result with the given value.
 *
 * @typeParam T - The type of the value to wrap.
 * @param value - The value to wrap in a successful result.
 * @returns A new Ok instance containing the value, typed as `Result<T, never>`.
 *
 * @public
 */
function ok<T>(value?: T): Result<T, never> {
  return {
    _id: 'Result',
    _tag: 'Ok',
    value: value ?? (undefined as T),
  };
}

/**
 * Creates a failed result with the given error.
 *
 * @typeParam E - The type of the error. See {@link ResultError}.
 * @param error - The error to wrap in a failed result.
 * @returns A new Err instance containing the error, typed as `Result<never, E>`.
 *
 * @public
 */
function err<E extends string>(error: E): Result<never, E> {
  return {
    _id: 'Result',
    _tag: 'Err',
    error,
  };
}

/**
 * Type guard to check if a result is successful.
 *
 * @typeParam T - The type of the successful value.
 * @typeParam E - The type of the error.
 * @param result - The result to check.
 * @returns True if the result is successful (Ok), false otherwise.
 *
 * @public
 */
function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
  return isResult(result) && result._tag === 'Ok';
}

/**
 * Type guard to check if a result is failed.
 *
 * @typeParam T - The type of the successful value.
 * @typeParam E - The type of the error.
 * @param result - The result to check.
 * @returns True if the result is failed (Err), false otherwise.
 *
 * @public
 */
function isErr<T, E>(result: Result<T, E>): result is Err<E> {
  return isResult(result) && result._tag === 'Err';
}

/**
 * Guard to check if a object is a result.
 *
 * @remarks
 * Verifies that the object is an object with the correct structure.
 *
 * @param result - The object to check.
 * @returns True if the object is a result with the correct structure, false otherwise.
 *
 * @public
 */
function isResult(result: unknown): result is Result<unknown, unknown> {
  if (typeof result !== 'object' || result === null || result === undefined) {
    return false;
  }

  const isResult = '_id' in result && result._id === 'Result';
  const isOk = isResult && '_tag' in result && result._tag === 'Ok' && 'value' in result;
  const isErr = isResult && '_tag' in result && result._tag === 'Err' && 'error' in result;
  return isOk || isErr;
}

/**
 * Unwraps a result.
 * If the result is ok, returns the value.
 * If the result is err, returns the error.
 *
 * @remarks
 * Commonly used for testing purposes.
 *
 * @param result - The result to unwrap.
 * @returns The value of the result if it is ok, otherwise the error.
 *
 * @public
 */
const unwrap = <T, E>(result: Result<T, E>) => (isOk(result) ? result.value : result.error);

/**
 * Creates a assert function that returns a result.
 *
 * @typeParam T - The type of the value to validate.
 * @typeParam E - The type of the error.
 * @param fn - The predicate function to validate the value.
 * @param error - The error to return if the predicate returns false.
 * @returns A assert function that returns a result.
 *
 * @public
 */
const assert = <T, E extends string>(fn: (v: T) => boolean, error: E) => (v: T): Result<T, E> =>
  fn(v) ? ok(v) : err(error);

export { assert, err, isErr, isOk, isResult, ok, unwrap };
export type { Err, Ok, Result, ResultFunction };
