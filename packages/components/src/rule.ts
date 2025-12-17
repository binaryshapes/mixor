/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { n } from '@nuxo/core';

/**
 * The tag for the rule component.
 *
 * @internal
 */
const RULE_TAG = 'Rule';

/**
 * The tag for the rule instance component.
 *
 * @internal
 */
const VALIDATOR_TAG = 'Validator';

/**
 * Rule component.
 *
 * A rule is a callable function that defines the logic of a validation and returns a
 * {@link Validator} component. Optionally accepts a {@link n.Failure} error class as the
 * last argument to override the default error type.
 *
 * @typeParam T - The type of the value to validate.
 * @typeParam E - The type of the error.
 * @typeParam A - The rule function arguments.
 *
 * @public
 */
type Rule<T, E, A extends n.Any[]> = n.Component<
  typeof RULE_TAG,
  // Without failure error class.
  & ((...args: A) => Validator<T, E>)
  // With custom failure error class.
  & (<CustomFailure extends new (params: n.Any) => n.Any>(
    ...args: [...A, customFailure: CustomFailure]
  ) => Validator<T, InstanceType<CustomFailure>>)
>;

/**
 * Extra metadata for the validator component.
 *
 * @typeParam T - The type of the value to validate.
 *
 * @internal
 */
type ValidatorMeta<T> = {
  /**
   * The valid examples for the validator.
   */
  validExamples: T[];

  /**
   * The invalid examples for the validator.
   */
  invalidExamples: T[];
};

/**
 * Validator component.
 *
 * A validator is a function component that contains the logic of a validation defined by
 * a {@link Rule} and apply those logic to a value. If the value meets the validation criteria,
 * the validator returns a successful {@link Result} with the value, otherwise it returns a failed
 * {@link Result} with the error.
 *
 * @typeParam T - The type of the value to validate.
 * @typeParam E - The type of the error.
 *
 * @public
 */
type Validator<T, E> = n.Component<
  typeof VALIDATOR_TAG,
  n.ResultFunction<T, E>,
  T,
  ValidatorMeta<T>
>;

/**
 * Helper function to check if a value is a failure class (constructor function).
 *
 * @remarks
 * Checks if the value is a function with a prototype, which indicates it's a class
 * that can be instantiated. This is used to detect failure classes passed as
 * the last argument to a rule.
 *
 * @internal
 */
const isFailureClass = (value: unknown): value is new (params: n.Any) => n.Any => {
  return (
    typeof value === 'function' &&
    value.prototype !== undefined &&
    value.prototype.constructor === value
  );
};

/**
 * Creates a new rule component.
 *
 * @typeParam T - The type of the value to validate.
 * @typeParam E - The type of the error.
 * @typeParam A - The rule function arguments.
 *
 * @param fn - The function that creates the validator.
 * @returns A proxy that creates a validator when called.
 *
 * @see {@link Rule} for more information.
 * @see {@link Validator} for more information.
 *
 * @public
 */
const rule = <T, E, A extends n.Any[]>(
  fn: (...args: A) => n.ResultFunction<T, E>,
): Rule<T, E, A> => {
  const parent = n.component(RULE_TAG, fn);

  return new Proxy(parent, {
    apply(target, thisArg, args) {
      // Check if the last argument is a failure error class.
      const lastArg = args[args.length - 1];
      const hasFailureClass = isFailureClass(lastArg);

      // Extract rule arguments (without the error class if present).
      const ruleArgs = hasFailureClass ? args.slice(0, -1) : args;
      const FailureClass = hasFailureClass ? lastArg : null;

      // Create the base validator with the original function.
      const baseResultFn = fn.apply(thisArg, ruleArgs as A);

      // If a failure error class is provided, wrap the result function to map errors.
      const resultFn = FailureClass
        ? (value: T) => {
          const result = baseResultFn(value);
          if (n.isErr(result)) {
            // Extract params from the original error and create new error instance.
            const originalError = result.error as n.Any;
            const params = originalError?.params || {};
            const newError = new FailureClass(params);
            return n.err(newError);
          }
          return result;
        }
        : baseResultFn;

      // TODO: Add the failure class to the validator uniqueness.
      const validator = n.component(VALIDATOR_TAG, resultFn, Object.values(target));

      // Adding the validator as a referenced object of the rule.
      n.info(target).refs(validator);

      // Inheriting the type of the rule (if not already set).
      if (!n.info(validator).props.type) {
        const type = n.info(target).props.type;
        if (type) {
          n.info(validator).type(type);
        }
      }

      return validator;
    },
  }) as Rule<T, E, A>;
};

/**
 * Guard function to check if the given object is a rule component.
 *
 * @param maybeRule - The value to check.
 * @returns True if the value is a rule, false otherwise.
 *
 * @public
 */
const isRule = (maybeRule: n.Any): maybeRule is Rule<n.DataValue, string, n.Any[]> =>
  n.isComponent(maybeRule, RULE_TAG);

/**
 * Guard function to check if the given object is a validator component.
 *
 * @param maybeValidator - The value to check.
 * @returns True if the value is a validator, false otherwise.
 *
 * @public
 */
const isValidator = (maybeValidator: n.Any): maybeValidator is Validator<n.Any, n.Any> =>
  n.isComponent(maybeValidator, VALIDATOR_TAG);

export { isRule, isValidator, rule };
export type { Rule, Validator };
