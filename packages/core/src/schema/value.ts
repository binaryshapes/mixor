/**
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { pipe } from '../funcs';
import { type Result, ok } from '../result';
import { type Component, Config, type ErrorMode, Panic, component, isComponent } from '../system';
import { type Any } from '../utils';
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
 * A rule list for the value.
 *
 * @typeParam T - The type of the value to validate.
 * @typeParam E - The type of the error.
 *
 * @internal
 */
type ValueRules<T, E> = Rule<T, E>[];

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
  T,
  ValueMeta<T>
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
class ValueError extends Panic<
  'Value',
  'UndefinedValue' | 'NullValue' | 'InvalidType' | 'InvalidRule' | 'RuleTypeNotDefined'
>('Value') {}

/**
 * Builder for the value component.
 *
 * @typeParam T - The type of the value to validate.
 * @typeParam E - The type of the error.
 *
 * @internal
 */
class ValueBuilder<T, E> {
  // Fixed name of the value builder.
  public static name = 'Value';

  /**
   * The rules of the value.
   */
  public rules: ValueRules<T, E>;

  /**
   * Whether the value is optional.
   *
   * @remarks
   * By default is required (false).
   */
  public isOptional = false;

  /**
   * Whether the value is nullable.
   *
   * @remarks
   * By default is required (false).
   */
  public isNullable = false;

  /**
   * Create a new value builder.
   *
   * @param rules - The rules of the value builder.
   */
  private constructor(rules: ValueRules<T, E>) {
    this.rules = rules;
  }

  /**
   * Make the value optional.
   *
   * @returns The new value builder.
   */
  public optional() {
    this.isOptional = true;
    return this as unknown as Value<T | undefined, E>;
  }

  /**
   * Make the value nullable.
   *
   * @returns The new value builder.
   */
  public nullable() {
    this.isNullable = true;
    return this as unknown as Value<T | null, E>;
  }

  /**
   * Create a new value builder.
   *
   * @param rules - The rules to compose the value component.
   * @returns The new value builder.
   */
  static create<T, E>(rules: ValueRules<T, E>) {
    // Defensive assertion to check if all rules are valid (should never happen).
    if (!rules.every(isRule)) {
      throw new ValueError('InvalidRule', 'A value must be composed only by rules.');
    }

    // All rules should have the type defined.
    if (!rules.every((rule) => !!rule.info?.type)) {
      throw new ValueError('RuleTypeNotDefined', 'All rules must have the type defined.');
    }

    // All types in the rules should be the same.
    const type = rules[0]?.info?.type as string;
    const sameType = rules.every((rule) => rule.info?.type === type);

    if (!sameType) {
      throw new ValueError('InvalidType', 'Multiple types are not supported for a value.');
    }

    const valueBuilder = new ValueBuilder<T, E>(rules);

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
      return pipe(mode, ...(rules as [Any]))(value);
    };

    const valueComponent = component('Value', valueFn, valueBuilder) as Value<T, E>;

    // Applying the type to the value component.
    valueComponent.type(type);

    // Adding the rules as children of the value component.
    valueComponent.addChildren(...rules);

    return valueComponent;
  }
}

/**
 * Creates a value component.
 *
 * @remarks
 * A value is a {@link Component} function composed by a list of rules. It returns a {@link Result}
 * depending if the value is valid or not. It can be optional and nullable. By default is required.
 * The value automatically adds the rules as children to the value, and inherits his type.
 *
 * @typeParam T - The type of the value to validate.
 * @typeParam E - The type of the error.
 *
 * @param rules - The rules to compose the value.
 * @returns The value component.
 *
 * @public
 */
const value = <T, E>(...rules: ValueRules<T, E>) => ValueBuilder.create<T, E>(rules);

/**
 * Guard function to check if an object is a value.
 *
 * @param maybeValue - The object to check.
 * @returns True if the object is a value, false otherwise.
 *
 * @public
 */
const isValue = (maybeValue: Any): maybeValue is Value<Any, Any> =>
  isComponent(maybeValue, 'Value');

export { isValue, value };
export type { Value };
