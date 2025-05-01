/*
 * This file is part of the Daikit project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Represents the outcome of an operation that can either succeed with a value of type `S`
 * or fail with a value of type `F`.
 */
type Result<S, F> = Success<S> | Failure<F>;

/**
 * Represents a successful outcome with a value of type `S`.
 */
interface Success<S> {
  /**
   * The successful value.
   */
  readonly isValue: S;
  /**
   * Indicates that the result is a success.
   */
  readonly _isSuccess: true;
  /**
   * Indicates that the result is not a failure.
   */
  readonly _isFailure?: undefined;
}

/**
 * Represents a failed outcome with a value of type `F`.
 */
interface Failure<F> {
  /**
   * The failure value.
   */
  readonly isFailure: F;
  /**
   * Indicates that the result is a failure.
   */
  readonly _isFailure: true;
  /**
   * Indicates that the result is not a success.
   */
  readonly _isSuccess?: undefined;
}

/**
 * Creates a `Result` representing a successful outcome with the given value.
 *
 * @param value The successful value of type `S`.
 * @returns A `Result` instance representing success.
 */
function success<S>(value: S): Result<S, never> {
  return { isValue: value, _isSuccess: true };
}

/**
 * Creates a `Result` representing a failed outcome with the given failure value.
 *
 * @param failure The failure value of type `F`.
 * @returns A `Result` instance representing failure.
 */
function fail<F>(failure: F): Result<never, F> {
  return { isFailure: failure, _isFailure: true };
}

/**
 * Checks if a `Result` is a `Success`.
 *
 * @param result The `Result` to check.
 * @returns `true` if the `Result` is a `Success`, `false` otherwise.
 */
function isSuccess<S, F>(result: Result<S, F>): result is Success<S> {
  return 'isValue' in result;
}

/**
 * Checks if a `Result` is a `Failure`.
 *
 * @param result The `Result` to check.
 * @returns `true` if the `Result` is a `Failure`, `false` otherwise.
 */
function isFail<S, F>(result: Result<S, F>): result is Failure<F> {
  return 'isFailure' in result;
}

export { success, fail, isSuccess, isFail };
export type { Result, Success, Failure };
