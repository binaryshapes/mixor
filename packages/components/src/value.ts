/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { n } from '@nuxo/core';

import { DEFAULT_ERROR_MODE } from './constants.ts';
import { isValidator, type Validator } from './rule.ts';

/**
 * Extra metadata for the value component.
 *
 * @typeParam T - The type of the value to validate.
 *
 * @internal
 */
type ValueMeta<T> = {
  /**
   * The example input for the value.
   */
  examples: T[];
};

/**
 * Value component.
 *
 * A value is a callable function that validates an input using one or more {@link Validator}
 * components and returns a {@link Result} with either the validated value or an error.
 *
 * @typeParam T - The type of the value to validate.
 * @typeParam E - The type of the error.
 * @typeParam R - Whether the value is required.
 *
 * @public
 */
type Value<T extends n.DataValue, E, R extends boolean = true> = n.Component<
  'Value',
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
 *
 * @public
 */
const ValuePanic = n.panic<
  'Value',
  | 'UndefinedNotAllowed'
  | 'NullNotAllowed'
  | 'InvalidType'
  | 'InvalidValidator'
  | 'RuleTypeNotDefined'
>('Value');

/**
 * Builder class for value components.
 *
 * Ensures the value component is always created with the same name and data container, also
 * provides all the necessary methods to configure the value component.
 *
 * @typeParam T - The type of the value to validate.
 * @typeParam E - The type of the error.
 *
 * @internal
 */
class ValueBuilder<T extends n.DataValue, E> {
  // Fixed name of the value component.
  public static name = 'Value';

  /**
   * The data container of the value.
   *
   * @internal
   */
  public data = n.data(null as T);

  /**
   * Whether the value is optional.
   *
   * @remarks
   * By default is required (false).
   *
   * @internal
   */
  public isOptional = false;

  /**
   * Whether the value is nullable.
   *
   * @remarks
   * By default is required (false).
   *
   * @internal
   */
  public isNullable = false;

  /**
   * Set the redacted state of the data container.
   *
   * @returns The new value builder.
   */
  public redacted() {
    this.data.redacted();
    return this;
  }

  /**
   * Make the value optional.
   *
   * @returns The new value builder.
   */
  public optional() {
    this.isOptional = true;
    return this as unknown as Value<T | undefined, E, false>;
  }

  /**
   * Make the value nullable.
   *
   * @returns The new value builder.
   */
  public nullable() {
    // Overriding the optional state to make the value nullable.
    this.isOptional = false;
    this.isNullable = true;
    return this as unknown as Value<T | null, E>;
  }

  /**
   * Make the value required.
   *
   * @returns The new value builder.
   */
  public required() {
    // Overriding the optional state to make the value required.
    this.isOptional = false;
    // Overriding the nullable state to make the value required.
    this.isNullable = false;
    return this as unknown as Value<T, E, true>;
  }
}

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
 * @param validations - One or more validator components to apply to the value.
 * @returns A value component that validates inputs according to the validators.
 *
 * @see {@link Value} for more information.
 *
 * @public
 */
const value = <T extends n.DataValue, E>(...validations: Validator<T, E>[]) => {
  // Defensive assertion to check if all validations are valid (should never happen).
  if (!validations.every(isValidator)) {
    throw new ValuePanic('InvalidValidator', 'A value must be composed only by validations.');
  }

  // // All rules should have the type defined.
  if (!validations.every((rule) => !!n.info(rule).props.type)) {
    throw new ValuePanic(
      'RuleTypeNotDefined',
      'All rules must have the type defined.',
      'Did you forget to define the type of the rule used in the validator?',
    );
  }

  // // All types in the rules should be the same.
  const type = n.info(validations[0]).props.type as string;
  const sameType = validations.every((rule) => n.info(rule).props.type === type);

  if (!sameType) {
    throw new ValuePanic('InvalidType', 'Multiple types are not supported for a value.');
  }

  // Initializing the value builder related to the value component.
  const valueBuilder = new ValueBuilder<T, E>();

  // Defining the value function that actually executes all the value validations.
  const valueFn = (value: T, mode: n.ErrorMode = DEFAULT_ERROR_MODE) => {
    // Checking if the value is undefined or null are allowed by the builder options.
    if (
      (value === undefined && valueBuilder.isOptional) ||
      (value === null && valueBuilder.isNullable)
    ) {
      // Set the value as it is without any validation.
      valueBuilder.data.set(value);
      return n.ok(valueBuilder.data);
    }

    // Avoiding to call the rules if the value is undefined and is not optional.
    if (value === undefined && !valueBuilder.isOptional) {
      throw new ValuePanic(
        'UndefinedNotAllowed',
        'The value cannot be undefined.',
        'Did you forget to pass the value or use the optional() option?',
      );
    }

    // Avoiding to call the rules if the value is null and is not nullable.
    if (value === null && !valueBuilder.isNullable) {
      throw new ValuePanic(
        'NullNotAllowed',
        'The value cannot be null.',
        'Did you forget to use the nullable() option?',
      );
    }

    // Processing the value through the rules and getting the result.
    const result = n.pipe(mode, ...(validations as [n.Any]))(value);

    if (n.isOk(result)) {
      valueBuilder.data.set(result.value as T);
      // Returning the builder data instead of the result value (to ensure redacted is applied).
      return n.ok(valueBuilder.data);
    }

    return result;
  };

  const valueComponent = n.component('Value', valueFn, valueBuilder, { ...validations });

  // Setting the type of the value component based on validators types.
  n.info(valueComponent).type(type);

  // Adding the validations as children of the value component.
  n.meta(valueComponent).children(...validations);

  // Adding the value component as a referenced object of the validations.
  for (const v of validations) {
    n.info(v).refs(valueComponent);
  }

  return valueComponent as Value<T, E>;
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
  n.isComponent(maybeValue, 'Value');

export { isValue, value, ValuePanic };
export type { Value };
