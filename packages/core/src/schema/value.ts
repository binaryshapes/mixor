/**
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { Panic } from 'src/panic';

import { type Component, component, isComponent } from '../component';
import Config from '../config';
import type { Any } from '../generics';
import { assert } from '../logger';
import { pipe } from '../pipe';
import { type ErrorMode, type Result, ok } from '../result';
import { type Rule, isRule } from './rule';

/**
 * Extra metadata for the value component.
 *
 * @typeParam T - The type of the value to validate.
 *
 * @internal
 */
type ValueMeta<T> = {
  /** The example input for the value. */
  example: T;
};

/**
 * Base value type that can be either a validator or a builder.
 * Uses the centralized error mode concept from {@link ErrorMode}.
 *
 * @typeParam T - The type of the value to validate.
 * @typeParam E - The type of the error.
 *
 * @public
 */
type Value<T, E> = Component<
  'Value',
  {
    // All mode returns an array of errors (default mode).
    (input: T, mode?: 'all'): Result<T, E[]>;

    // Strict mode returns a single error.
    (input: T, mode: 'strict'): Result<T, E>;
  } & ValueBuilder<T, E>,
  ValueMeta<T>,
  T
>;

/**
 * Error thrown inside the value component.
 *
 * @remarks
 * This error is thrown when:
 * - `UndefinedValue`: The value is undefined and is not optional.
 * - `NullValue`: The value is null and is not nullable.
 *
 * @public
 */
class ValueError extends Panic<'Value', 'UndefinedValue' | 'NullValue'>('Value') {}

/**
 * Builder for the value component.
 *
 * @typeParam T - The type of the value to validate.
 * @typeParam E - The type of the error.
 *
 * @internal
 */
class ValueBuilder<T, E> {
  private constructor(
    public readonly rules: Rule<T, E>[],
    public readonly isOptional: boolean,
    public readonly isNullable: boolean,
  ) {}

  /**
   * Make the value optional.
   *
   * @returns The new value builder.
   */
  public optional() {
    return ValueBuilder.create<T | undefined, E>(
      this.rules as Rule<T | undefined, E>[],
      true,
      this.isNullable,
    );
  }

  /**
   * Make the value nullable.
   *
   * @returns The new value builder.
   */
  public nullable() {
    return ValueBuilder.create<T | null, E>(
      this.rules as Rule<T | null, E>[],
      this.isOptional,
      true,
    );
  }

  /**
   * Create a new value builder.
   *
   * @param rules - The rules to compose the value component.
   * @param isOptional - Whether the value is optional.
   * @param isNullable - Whether the value is nullable.
   * @returns The new value builder.
   */
  static create<T, E>(rules: Rule<T, E>[], isOptional = false, isNullable = false) {
    // Defensive assertion to check if all rules are valid (should never happen).
    assert(rules.every(isRule), 'A value component must be composed only by rules.');

    const valueBuilder = new ValueBuilder<T, E>(rules, isOptional, isNullable);

    const valueFn = (value: T, mode: ErrorMode = Config.defaultErrorMode) => {
      if (
        (valueBuilder.isOptional && value === undefined) ||
        (valueBuilder.isNullable && value === null)
      ) {
        return ok(value);
      }

      // Avoiding to call the rules if the value is undefined and is not optional.
      if (value === undefined && !valueBuilder.isOptional) {
        throw new ValueError('UndefinedValue', `The value is undefined but is not optional.`);
      }

      // Avoiding to call the rules if the value is null and is not nullable.
      if (value === null && !valueBuilder.isNullable) {
        throw new ValueError('NullValue', 'The value is null but is not nullable.');
      }

      // Running the rules.
      return pipe(mode, ...(rules as unknown as [Any]))(value);
    };

    // Create the base value component with the rule pipeline.
    const baseValue = component('Value', Object.setPrototypeOf(valueFn, valueBuilder), rules);

    // Add the rules to the base value component.
    baseValue.addChildren(...rules);

    return baseValue as Value<T, E>;
  }
}

/**
 * Creates a value component.
 *
 * @param rules - The rules to compose the value component.
 * @returns The value component.
 *
 * @public
 */
const value = <R extends Rule<Any, Any>[]>(...rules: R) => {
  type T = R extends Rule<infer TT, Any>[] ? TT : never;
  type E = R extends Rule<Any, infer EE>[] ? EE : never;

  // Return the base value component.
  return ValueBuilder.create<T, E>(rules);
};

/**
 * Guard function to check if a object is a value component.
 *
 * @param maybeValue - The object to check.
 * @returns True if the object is a value component, false otherwise.
 *
 * @public
 */
const isValue = (maybeValue: Any): maybeValue is Value<Any, Any> =>
  isComponent(maybeValue, 'Value');

export { isValue, value };
export type { Value };
