/*
 * This file is part of the Mixor project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { config } from './_config';
import type { ErrorMode } from './_err';
import { type Component, component, isComponent } from './component';
import type { Any } from './generics';
import { assert } from './logger';
import { pipe } from './pipe';
import { type Result } from './result';

/**
 * Defines the shape of a value function. Must return a result with known error type.
 *
 * @typeParam T - The type of the value to validate.
 * @typeParam E - The type of the error.
 *
 * @internal
 */
type ValueFunction<T, E> = (value: T) => Result<T, E>;

/**
 * A function to apply to a value to validate it.
 *
 * @typeParam T - The type of the value to validate.
 * @typeParam E - The type of the error.
 * @param value - The value to validate.
 * @returns A result containing the validated value or an error.
 *
 * @public
 */
type Rule<T, E> = Component<
  'Rule',
  {
    (value: T): Result<T, E>;
  }
>;

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
  }
>;

/**
 * Create a value rule for validation.
 *
 * @typeParam T - The type of the value to validate.
 * @typeParam E - The type of the error.
 * @param rule - The validation function to create.
 * @returns A new value rule.
 *
 * @public
 */
const rule = <T, E>(rule: ValueFunction<T, E>) => component('Rule', rule) as Rule<T, E>;

/**
 * Creates a value that combines multiple rules for field validation.
 * Combines rules using function composition for validation.
 *
 * @remarks
 * The value automatically adds the rules as children to the value component.
 *
 * @param rules - The validation rules to apply to the value.
 * @returns A new value validator.
 *
 * @public
 */
const value = <R extends Rule<Any, Any>[]>(...rules: R) => {
  type T = R extends Rule<infer TT, Any>[] ? TT : never;
  type E = R extends Rule<Any, infer EE>[] ? EE : never;

  // Defensive assertion (should never happen).
  assert(rules.every(isRule), 'Invalid rules');

  return component(
    'Value',
    (value: T, mode: ErrorMode = config.defaultErrorMode) =>
      pipe(mode, ...(rules as unknown as [Any]))(value),
    rules,
  ).addChildren(...rules) as Value<T, E>;
};

/**
 * Guard check to determine if the given value is a value validator.
 *
 * @param maybeValue - The value to check.
 * @returns True if the value is a value validator, false otherwise.
 *
 * @public
 */
const isValue = (maybeValue: Any): maybeValue is Value<Any, Any> =>
  isComponent(maybeValue, 'Value');

/**
 * Guard check to determine if the given value is a rule.
 *
 * @param maybeRule - The value to check.
 * @returns True if the value is a rule, false otherwise.
 *
 * @public
 */
const isRule = (maybeRule: Any): maybeRule is Rule<Any, Any> => isComponent(maybeRule, 'Rule');

export type { Value, Rule };
export { isValue, isRule, rule, value };
