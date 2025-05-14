/*
 * This file is part of the Daikit project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { type Result, failure, success } from '@daikit/result';

/**
 * Represents a type that is used to justify the use of `any`.
 * This type is used internally to allow for flexible group validation rules
 * while maintaining type safety at the API level.
 *
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExplicitAny = any;

/**
 * Validator error type.
 * It is a string that contains a namespace and a message.
 * All must be uppercase.
 *
 * @public
 */
type ValidatorError = Uppercase<string>;

/**
 * Short alias for the type of the arguments of a validator function.
 *
 * @internal
 */
type Args = Array<unknown>;

/**
 * Represents a validator function that takes an input value and returns a Result.
 *
 * @typeParam T - The type of the input value.
 * @typeParam E - The type of the error literal type.
 * @param input - The input value to validate.
 * @returns A Result indicating the success or failure of the validation.
 *
 * @public
 */
type Validator<T = never, E extends ValidatorError = never> = (input: T) => Result<true, E>;

/**
 * A function that returns a validator.
 *
 * @param args - The arguments to pass to the validator.
 * @returns A validator function.
 *
 * @public
 */
type ValidatorFunction = (...args: ExplicitAny[]) => Validator<ExplicitAny, ValidatorError>;

/**
 * Represents a validator function that takes an input and returns a boolean. This kind of
 * function could have or not config parameters.
 *
 * @internal
 */
type BooleanValidator = (...args: ExplicitAny[]) => (value: ExplicitAny) => boolean;

/**
 * A type that reverses an array.
 *
 * @internal
 */
type Reverse<T extends Args> = T extends [infer First, ...infer Rest]
  ? [...Reverse<Rest>, First]
  : [];

/**
 * A type that removes the first parameter from an array.
 *
 * @internal
 */
type RemoveFirstParam<T extends Args> = T extends [unknown, ...infer Rest] ? Rest : T;

/**
 * A type that makes the last parameter of an array optional.
 *
 * @internal
 */
type MakeLastParamOptional<T extends Args> = T extends [...infer Rest, infer Last]
  ? [...Rest, Last?]
  : [];

/**
 * A type that infers and reshape the arguments of a boolean validator or a validator function.
 *
 * @internal
 */
type ValidatorArgs<
  F extends BooleanValidator | ValidatorFunction,
  E = Parameters<F> extends [infer E, ...args: Args] ? E : never,
> = F extends ValidatorFunction
  ? MakeLastParamOptional<RemoveFirstParam<Reverse<[E, ...Parameters<F>]>>>
  : Reverse<[E, ...Parameters<F>]>;

/**
 * Override the validator error type.
 *
 * @public
 */
type OverrideError<E, DE, L = E extends `${infer U}` ? U : DE> = L;

/**
 * Creates a validator function for the given validator function and default error.
 *
 * @typeParam F - The validator function type which must be a {@link BooleanValidator}.
 * @typeParam DE - The default error type which must be a {@link ValidatorError}.
 * @typeParam T - The type of the input value inferred from the validator function.
 *
 * @param validator - The validator function to create a validator for.
 * @param defaultError - The default error to use if the validator function returns false.
 * @returns A validator function {@link Validator}.
 *
 * @public
 */
function createValidator<
  F extends BooleanValidator,
  DE extends ValidatorError,
  T = ReturnType<F> extends (value: infer V) => boolean ? V : never,
>(validator: F, defaultError: DE) {
  return <E extends ValidatorError, OE extends OverrideError<E, DE>>(
    ...args: ValidatorArgs<F, E>
  ): Validator<T, OE> => {
    return (value: T) => {
      const result = validator(...args)(value);
      if (!result) {
        const cause = args[args.length - 1][0];
        return failure((cause ?? defaultError) as OE);
      }
      return success(true);
    };
  };
}

export type { Validator, ValidatorFunction, ValidatorError, ValidatorArgs };
export { createValidator };
