/**
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { type Component, component, isComponent } from '../component';
import type { Any } from '../generics';
import type { ResultFunction } from '../result';

/**
 * Extra metadata for the rule component.
 *
 * @typeParam T - The type of the value to validate.
 *
 * @internal
 */
type RuleMeta<T> = {
  /** The example input for the rule that is valid. */
  validExample: T;

  /** The example input for the rule that is invalid. */
  invalidExample: T;
};

/**
 * Rule component type.
 *
 * @typeParam T - The type of the value to validate.
 * @typeParam E - The type of the error.
 *
 * @public
 */
type Rule<T, E> = Component<'Rule', ResultFunction<T, E>, RuleMeta<T>, T>;

/**
 * Creates a new rule.
 *
 * @remarks
 * A rule is a {@link Component} function that validates a value and returns a {@link Result}
 * depending if the value is valid or not.
 *
 * @param ruleFn - The rule function.
 * @returns The new rule.
 *
 * @public
 */
const rule = <T, E>(ruleFn: ResultFunction<T, E>) => component('Rule', ruleFn) as Rule<T, E>;

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
