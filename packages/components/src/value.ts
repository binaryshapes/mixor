/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { n } from '@nuxo/core';

import { DEFAULT_ERROR_MODE, DEFAULT_VALUE_COERCE } from './constants.ts';
import { isValidator, type Validator } from './rule.ts';

/**
 * The tag for the value component.
 *
 * @internal
 */
const VALUE_TAG = 'Value' as const;

/**
 * Extra metadata for the value component.
 *
 * @typeParam T - The type of the value to validate.
 *
 * @internal
 */
type ValueMeta<T> = {
  /**
   * The example inputs for the value.
   */
  examples: T[];
};

/**
 * Value component.
 *
 * A value is a callable function that validates an input using one or more {@link Validator}
 * components and returns a Result with either the validated value or an error.
 *
 * @typeParam T - The type of the value to validate.
 * @typeParam E - The type of the error.
 * @typeParam R - Whether the value is required.
 *
 * @public
 */
type Value<T extends n.DataValue, E, R extends boolean = true> = n.Component<
  typeof VALUE_TAG,
  & (R extends true ? {
      <M extends n.ErrorMode = (typeof DEFAULT_ERROR_MODE)>(
        input: T,
        mode?: M,
      ): n.Result<T, n.ApplyErrorMode<E, M>>;
    }
    : {
      <M extends n.ErrorMode = (typeof DEFAULT_ERROR_MODE)>(
        input?: T,
        mode?: M,
      ): n.Result<T, n.ApplyErrorMode<E, M>>;
    })
  & ValueBuilder<T, E>,
  T,
  ValueMeta<T>
>;

/**
 * Error thrown inside the value component.
 *
 * @remarks
 * This error is thrown when:
 * - `UndefinedNotAllowed`: The value is undefined and is not optional.
 * - `NullNotAllowed`: The value is null and is not nullable.
 * - `InvalidType`: The value type is not supported.
 * - `InvalidValidator`: Some of the validators are invalid.
 * - `RuleTypeNotDefined`: Some of the rules do not have the type defined.
 * - `InvalidInputType`: The input value is not of the expected type.
 *
 * @public
 */
class ValuePanic extends n.panic<
  typeof VALUE_TAG,
  | 'UndefinedNotAllowed'
  | 'NullNotAllowed'
  | 'InvalidType'
  | 'InvalidValidator'
  | 'RuleTypeNotDefined'
  | 'InvalidInputType'
>(VALUE_TAG) {}

/**
 * Value component builder class which provides a set of builder methods in order to build a value
 * with the given validations, type and options.
 *
 * @typeParam T - The type of the value to validate.
 * @typeParam E - The type of the error.
 *
 * @internal
 */
class ValueBuilder<T extends n.DataValue, E> {
  constructor(
    public validations: Validator<T, E>[],
    public type: string,
    public isRedacted = false,
    public isOptional = false,
    public isNullable = false,
    public isCoerced = DEFAULT_VALUE_COERCE,
  ) {}

  /**
   * Make the value as redacted, so it will be returned as a redacted placeholder.
   *
   * @remarks
   * Under the hood, this method uses the core "data" class to wrap the value.
   *
   * @returns A value component that validates inputs according to the validators and is redacted.
   */
  public redacted() {
    this.isRedacted = true;
    return valueComponent(this.validations, this.type, this) as Value<T, E>;
  }

  /**
   * Make the value as optional (could be undefined).
   *
   * @remarks
   * Any validation for the value will be omitted if the value is undefined.
   * It can be combined with the nullable() method to create a value that accepts null or
   * undefined values.
   *
   * @returns A value component that validates inputs according to the validators and is optional.
   */
  public optional() {
    this.isOptional = true;
    return valueComponent(this.validations, this.type, this) as Value<T | undefined, E, false>;
  }

  /**
   * Make the value as nullable (accepts null values).
   *
   * @remarks
   * Any validation for the value will be omitted if the value is null.
   * It can be combined with the optional() method to create a value that accepts null or
   * undefined values.
   *
   * @returns A value component that validates inputs according to the validators and is nullable.
   */
  public nullable() {
    this.isNullable = true;
    return valueComponent(this.validations, this.type, this) as Value<T | null, E>;
  }

  /**
   * Make the value as required (cannot be undefined or null).
   *
   * @remarks
   * If the value is null or undefined, it will be treated as an error and no validations will
   * be performed.
   *
   * @returns A value component that validates inputs according to the validators and is required.
   */
  public required() {
    this.isOptional = false;
    this.isNullable = false;
    return valueComponent(this.validations, this.type, this) as Value<T, E, true>;
  }

  /**
   * Make the value as coerced, so it will be coerced to the type of the value.
   *
   * @param coerce - Whether to coerce the value to the type of the value
   * (optional, defaults to DEFAULT_VALUE_COERCE).
   * @returns A value component that validates inputs according to the validators and is coerced.
   */
  public coerce(coerce: boolean = DEFAULT_VALUE_COERCE) {
    this.isCoerced = coerce;
    return valueComponent(this.validations, this.type, this) as Value<T, E>;
  }
}

/**
 * Creates a value function that captures the state in its closure.
 *
 * @typeParam T - The type of the value to validate.
 * @typeParam E - The type of the error.
 *
 * @param validations - The validator components to apply to the value.
 * @param builder - The builder for the value component.
 *
 * @internal
 */
const valueFn = <T extends n.DataValue, E>(
  validations: Validator<T, E>[],
  builder: ValueBuilder<T, E>,
) => {
  // Capture the builder state in closure.
  const state = { ...builder, validations };

  // The value function to be returned which executes the validations and returns the result.
  const fn = function (value: T, mode: n.ErrorMode = DEFAULT_ERROR_MODE) {
    // Early return if optional/nullable
    if ((value === undefined && state.isOptional) || (value === null && state.isNullable)) {
      return n.ok(state.isRedacted ? n.data(value).redacted() : n.data(value));
    }

    // Validation checks
    if (value === undefined && !state.isOptional) {
      throw new ValuePanic(
        'UndefinedNotAllowed',
        'The value cannot be undefined.',
        'Did you forget to pass the value or use the optional() option?',
      );
    }

    if (value === null && !state.isNullable) {
      throw new ValuePanic(
        'NullNotAllowed',
        'The value cannot be null.',
        'Did you forget to use the nullable() option?',
      );
    }

    // We instantiate a new data container with the original value.
    const val = n.data(value as T);

    // If coerced, coerce the value to the type of the value.
    if (state.isCoerced) {
      // Defensive asserting in order to fix the root cause of the problem.
      n.logger.assert(
        (typeof value) === state.type,
        `Expected type "${state.type}" but got "${typeof value}" with value: ${String(value)}.`,
      );
      val.coerce(state.type);
    } else if ((typeof value) !== state.type) {
      // This should never happen if the value is coerced.
      throw new ValuePanic(
        'InvalidInputType',
        `Expected type "${state.type}" but got "${typeof value}" with value: ${String(value)}.`,
        n.doc`
        Did you forget to coerce the value?
        Please use the coerce() method to force the value to the expected type "${state.type}".
        `,
      );
    }

    // Run validations in order to validate the value.
    const result = n.pipe(mode, ...(state.validations as [n.Any]))(val.get());

    // If error, return as is.
    if (n.isErr(result)) {
      return result;
    }

    // If success, return the value (redacted if needed).
    return n.ok(state.isRedacted ? val.redacted().get() : val.get());
  };

  return fn;
};

/**
 * Creates a new value component for the given validations, type and builder.
 *
 * @typeParam T - The type of the value to validate.
 * @typeParam E - The type of the error.
 *
 * @param validations - One or more validator components to apply to the value.
 * @param type - The type of the value.
 * @param builder - The builder for the value component (optional, defaults to a new builder).
 *
 * @returns A value component that validates inputs according to the validators.
 *
 * @internal
 */
const valueComponent = <T extends n.DataValue, E>(
  validations: Validator<T, E>[],
  type: string,
  builder: ValueBuilder<T, E> = new ValueBuilder(validations, type),
): Value<T, E> => {
  const vf = valueFn(validations, builder);
  const vc = n.component(VALUE_TAG, vf, builder);

  // Setting the type of the value component based on validators types (if not already set).
  if (!n.info(vc).props.type) {
    n.info(vc).type(type);
  }

  // Adding the validations as children of the value component.
  n.meta(vc).children(...validations);

  // Adding the value component as a referenced object of the validations.
  for (const v of validations) {
    n.info(v).refs(vc);
  }

  return vc as Value<T, E>;
};

/**
 * Creates a new value component.
 *
 * @remarks
 * A value component validates an input using one or more {@link Validator} components.
 * It provides methods to configure the value as optional, nullable, or required, and
 * to set it as redacted.
 *
 * @typeParam T - The type of the value to validate.
 * @typeParam E - The type of the error.
 *
 * @param validations - One or more validator components to apply to the value (rest parameter).
 * @returns A value component that validates inputs according to the validators.
 *
 * @see {@link Value} for more information.
 *
 * @public
 */
const value = <T extends n.DataValue, E>(...validations: Validator<T, E>[]) => {
  // Runtime check to ensure all provided validators are valid.
  if (!validations.every(isValidator)) {
    throw new ValuePanic('InvalidValidator', 'A value must be composed only by validations.');
  }

  // Runtime check to ensure all provided validators have the type defined.
  if (!validations.every((rule) => !!n.info(rule).props.type)) {
    throw new ValuePanic(
      'RuleTypeNotDefined',
      'All rules must have the type defined.',
      'Did you forget to define the type of the rule used in the validator?',
    );
  }

  // Runtime check to ensure all provided validators have the same type.
  const type = n.info(validations[0]).props.type as string;
  if (!validations.every((rule) => n.info(rule).props.type === type)) {
    const types = validations.map((rule) => `"${n.info(rule).props.type}"`).join(', ');
    throw new ValuePanic(
      'InvalidType',
      'Multiple types are not supported for a value.',
      `The provided types are: ${types}. Please provide a single type for the value.`,
    );
  }

  // Always create a default value component.
  return valueComponent(validations, type);
};

/**
 * Guard function to check if an object is a value.
 *
 * @param maybeValue - The object to check.
 * @returns True if the object is a value, false otherwise.
 *
 * @public
 */
const isValue = (maybeValue: n.Any): maybeValue is Value<n.Any, n.Any> =>
  n.isComponent(maybeValue, VALUE_TAG);

export { isValue, value, ValuePanic };
export type { Value };
