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
 * Rule constructor type.
 *
 * @typeParam T - The type of the value to validate.
 * @typeParam E - The type of the error.
 *
 * @internal
 */
interface RuleConstructor {
  /**
   * Creates a rule from a function and an error.
   *
   * @param fn - The rule function.
   * @param error - The error to return if the rule fails.
   * @returns The new rule.
   */
  <T, E>(fn: (v: T) => boolean, error: E): Rule<T, E>;
  /**
   * Creates a rule from a function.
   *
   * @param fn - The rule function.
   * @returns The new rule.
   */
  <T, E>(fn: RuleFn<T, E>): Rule<T, E>;
}

/**
 * Creates a new rule.
 *
 * @remarks
 * A rule is a {@link Component} function that validates a value and returns a {@link Result}
 * depending if the value is valid or not.
 *
 * @param args - The rule definitions.
 * - If the first argument is a function and the second argument is an error,
 * the rule will be created with the assert function.
 * - If is a only a function, this needs to be a {@link Result} function.
 * @returns The new rule.
 *
 * @public
 */
const rule: RuleConstructor = <T, E extends Failure<Any> | string>(...args: Any[]) => {
  const fn = args[0];
  const error = args.slice(1) as Any;
  const r = error ? component('Rule', assert(fn, error), { fn, error }) : component('Rule', fn);
  return r as Rule<T, E>;
};

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
