/**
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { type Failure, type ResultFunction, assert } from '../result';
import { type Component, component, isComponent } from '../system';
import { type Any } from '../utils';

/**
 * Extra metadata for the rule component.
 *
 * @typeParam T - The type of the value to validate.
 *
 * @internal
 */
type RuleMeta<T> = {
  /**
   * The example input for the rule that is valid.
   */
  validExample: T;

  /**
   * The example input for the rule that is invalid.
   */
  invalidExample: T;
};

/**
 * The function type for the rule.
 *
 * @typeParam T - The type of the value to validate.
 * @typeParam E - The type of the error.
 *
 * @internal
 */
type RuleFn<T, E> = ResultFunction<T, E>;

/**
 * Rule component type.
 *
 * @typeParam T - The type of the value to validate.
 * @typeParam E - The type of the error.
 *
 * @public
 */
type Rule<T, E> = Component<'Rule', RuleFn<T, E>, T, RuleMeta<T>>;

/**
 * Creates a new rule.
 *
 * @remarks
 * A rule is a {@link Component} function that validates a value and returns a {@link Result}
 * depending if the value is valid or not.
 *
 * @param fn - The rule function.
 * @param error - The error to return if the rule fails.
 * @returns The new rule.
 *
 * @public
 */
const rule = <T, E extends Failure<Any> | string>(fn: (v: T) => boolean, error: E) =>
  component(
    'Rule',
    // The rule is just a wrapper around the assert function.
    assert(fn, error as Any),
    // The rule has the original function and error for registration purposes.
    { fn, error },
  ) as Rule<T, E>;

/**
 * Guard function to check if the given object is a rule component.
 *
 * @param maybeRule - The value to check.
 * @returns True if the value is a rule, false otherwise.
 *
 * @public
 */
const isRule = (maybeRule: Any): maybeRule is Rule<Any, Any> => isComponent(maybeRule, 'Rule');

export { isRule, rule };
export type { Rule };
