/*
 * This file is part of the Daikit project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Represents a successful result with a value of type T.
 * This is the happy path of the Result monad.
 */
export type Ok<T> = {
  readonly _tag: 'Ok';
  readonly value: T;
};

/**
 * Represents a failed result with an error of type E.
 * This is the error path of the Result monad.
 */
export type Err<E> = {
  readonly _tag: 'Err';
  readonly error: E;
};

/**
 * Represents a result that can be either successful (Ok) or failed (Err).
 * This is a discriminated union type that allows for type-safe error handling.
 *
 * @typeParam T - The type of the successful value.
 * @typeParam E - The type of the error, must be a string literal.
 */
export type Result<T, E> = Ok<T> | Err<E>;

/**
 * Creates a successful result with the given value.
 *
 * @typeParam T - The type of the value to wrap.
 * @param value - The value to wrap in a successful result.
 * @returns A new Ok instance containing the value.
 */
export const ok = <T>(value: T): Ok<T> => ({
  _tag: 'Ok',
  value,
});

/**
 * Creates a failed result with the given error.
 * The error must be a string literal for proper type inference.
 *
 * @typeParam E - The type of the error, must be a string literal.
 * @param error - The error to wrap in a failed result.
 * @returns A new Err instance containing the error.
 */
export const err = <E extends string>(error: E): Err<E> => ({
  _tag: 'Err',
  error,
});

/**
 * Type guard to check if a result is successful.
 *
 * @typeParam T - The type of the successful value.
 * @typeParam E - The type of the error.
 * @param result - The result to check.
 * @returns True if the result is successful (Ok), false otherwise.
 */
export const isOk = <T, E>(result: Result<T, E>): result is Ok<T> => result._tag === 'Ok';

/**
 * Type guard to check if a result is failed.
 *
 * @typeParam T - The type of the successful value.
 * @typeParam E - The type of the error.
 * @param result - The result to check.
 * @returns True if the result is failed (Err), false otherwise.
 */
export const isErr = <T, E>(result: Result<T, E>): result is Err<E> => result._tag === 'Err';
