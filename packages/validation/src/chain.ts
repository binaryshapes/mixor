/*
 * This file is part of the Daikit project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { type Result, failure, success } from '@daikit/result';

import type { Validator, ValidatorArgs, ValidatorError, ValidatorFunction } from './validator';

/**
 * A set of validators.
 *
 * @internal
 */
type ValidatorSet = Record<string, ValidatorFunction>;

/**
 * A chain of validators.
 * It is used to chain validators together in the {@link ValidationChain} class.
 *
 * @privateRemarks
 * This is a syntetich interface for a chain, beause internally the chain is an object
 * with the methods as keys, and the methods are functions that return the chain itself.
 *
 * @internal
 */
type Chain<V extends ValidatorSet, E extends ValidatorError = never> = {
  [K in keyof V]: V[K] extends ValidatorFunction
    ? <F2 extends ValidatorError = ReturnType<V[K]> extends Validator<never, infer F> ? F : never>(
        ...args: ValidatorArgs<V[K], F2>
      ) => Chain<V, E | F2>
    : never;
} & {
  build: {
    (): (value: string) => Result<true, E>;
    <L extends Uppercase<string>>(scope: L): (value: string) => Result<true, `${L}.${E}`>;
  };
};

/**
 * A chain of validators is a useful and handy way to chain validators together.
 *
 * @public
 */
class ValidationChain<V extends ValidatorSet> {
  private readonly validators: Array<ReturnType<ValidatorFunction>> = [];

  /**
   * Creates a new ValidationChain instance.
   *
   * @param methods - The methods to chain.
   *
   * @internal
   */
  private constructor(readonly methods: V) {
    for (const [key, value] of Object.entries(methods)) {
      // We create a new function that actually executes the validator.
      // Under the hood, it will push the validator to the `validators` array wich contains
      // all the validators configured by the user.
      const fn = (...args: Parameters<typeof value>) => {
        const validator = value(args);
        this.validators.push(validator);

        // To make the method chainable, we return the instance of the class.
        return this;
      };

      // Using the original key of the method, we define the new function in the root of class, to
      // make it available to be chained.
      Object.defineProperty(this, key, {
        value: fn,
        writable: false,
        enumerable: true,
        configurable: false,
      });
    }
  }

  /**
   * Creates a new ValidationChain instance.
   *
   * @param methods - The methods to chain.
   * @returns A new ValidationChain instance.
   *
   * @public
   */
  static create<V extends ValidatorSet>(methods: V) {
    return new ValidationChain<V>(methods) as unknown as Chain<V>;
  }

  /**
   * Builds a validator function with all chained validators.
   *
   * @param scope - The scope of the validator.
   * @returns A validator function.
   *
   * @public
   */
  public build<L extends string>(scope?: L) {
    return (value: string) => {
      for (const validator of this.validators) {
        const result = validator(value);
        if ('cause' in result) {
          return failure(`${scope ? `${scope}.` : ''}${result.cause}`);
        }
      }
      return success(true);
    };
  }
}

export { ValidationChain };
