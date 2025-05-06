/*
 * This file is part of the Daikit project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { type Result } from '@daikit/result';

/**
 * A type that is used to justify the use of any in validation contexts.
 * It is used to avoid type errors when using the any type through the codebase.
 *
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ValidationAny = any;

/**
 * Represents a validator function that takes an input and returns a Result.
 *
 * @typeParam T - The type of the input value.
 * @typeParam E - The type of the error message.
 * @param input - The input value to validate.
 * @returns A Result indicating the success or failure of the validation.
 *
 * @public
 */
type Validator<T, E extends string> = (input: T) => Result<void, E>;

/**
 * Represents a list of validators.
 *
 * @typeParam T - The type of the input value.
 *
 * @public
 */
type ValidatorList<T> = readonly Validator<T, string>[];

/**
 * Represents a map of field validators.
 *
 * @typeParam T - The type of the input value.
 *
 * @public
 */
type ValidatorMap<T> = {
  [K in keyof T]?: ValidatorList<T[K]>;
};

/**
 * Infer the error type from a list of validators.
 *
 * @typeParam V - The type of the list of validators.
 * @returns The error type.
 *
 * @public
 */
type ValidatorListErrors<V extends readonly Validator<ValidationAny, ValidationAny>[]> =
  V[number] extends Validator<ValidationAny, infer E> ? E : never;

/**
 * Infer the error type from a field validators map.
 *
 * @typeParam FV - The type of the field validators map.
 * @returns The error type.
 *
 * @public
 */
type ValidatorMapErrors<T> =
  T extends ValidatorMap<ValidationAny>
    ? {
        [K in keyof T]: T[K] extends readonly Validator<ValidationAny, infer E>[] ? E : never;
      }[keyof T]
    : never;

export type { ValidatorMapErrors, ValidatorListErrors, Validator, ValidatorList, ValidatorMap };
