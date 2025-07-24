/*
 * This file is part of the Mixor project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { type Element, element, isElement } from './element';
import type { Any } from './generics';
import { hash } from './hash';
import { type Result } from './result';

/**
 * A function to apply to a value to validate it.
 *
 * @typeParam T - The type of the value to validate.
 * @typeParam E - The type of the error.
 * @param value - The value to validate.
 * @returns A result containing the validated value or an error.
 *
 * @see {@link Value} for the value wrapper that uses this function.
 * @see {@link Result} for the result type returned by validation.
 *
 * @internal
 */
type ValueFunction<T, E> = (value: T) => Result<T, E>;

/**
 * A value wrapper that provides individual field validation.
 *
 * @typeParam T - The type of the value to validate.
 * @typeParam E - The type of the error.
 *
 * @see {@link ValueFunction} for the validation function type.
 * @see {@link Result} for the result type returned by validation.
 * @see {@link Element} for the base element type.
 *
 * @public
 */
type Value<T, E> = Element<
  'Value',
  {
    /**
     * Validates a single value using the provided validation function.
     *
     * @param input - The value to validate.
     * @returns A result containing the validated value or an error.
     *
     * @see {@link ValueFunction} for the validation function type.
     * @public
     */
    (input: T): Result<T, E>;
    /**
     * The validation function used by this value wrapper.
     *
     * @readonly
     * @see {@link ValueFunction} for the validation function type.
     * @public
     */
    readonly validator: ValueFunction<T, E>;
  }
>;

/**
 * Interface for the value function overloads.
 *
 * @see {@link Value} for the value wrapper type.
 * @see {@link ValueFunction} for the validation function type.
 *
 * @internal
 */
interface ValueDefinition {
  /**
   * Creates a value wrapper for individual field validation.
   *
   * @param validator - The validation function to wrap.
   * @returns A value wrapper that can validate individual values.
   *
   * @see {@link Value} for the value wrapper type.
   * @public
   */
  <T, E>(validator: ValueFunction<T, E>): Value<T, E>;

  /**
   * Creates a value wrapper for individual field validation with documentation.
   *
   * @param doc - Documentation of the value being validated.
   * @param validator - The validation function to wrap.
   * @returns A value wrapper that can validate individual values.
   *
   * @see {@link Value} for the value wrapper type.
   * @public
   */
  <T, E>(doc: string, validator: ValueFunction<T, E>): Value<T, E>;
}

/**
 * Creates a value wrapper for individual field validation.
 *
 * @param args - The arguments to create the value wrapper. Can be either a validation function or
 * a doc string followed by a validation function.
 * @returns A value wrapper that can validate individual values.
 *
 * @see {@link Value} for the value wrapper type.
 * @see {@link ValueFunction} for the validation function type.
 * @see {@link isValue} for checking if a value is a value wrapper.
 *
 * @example
 * ```ts
 * // value-001: Basic value validation.
 * const nameValue = value((name: string) =>
 *   name.length > 0 ? ok(name) : err('EMPTY_NAME')
 * );
 * // nameValue: Value<string, 'EMPTY_NAME'>.
 * const result = nameValue('John'); // ok('John').
 * ```
 *
 * @example
 * ```ts
 * // value-002: Value validation with documentation.
 * const ageValue = value(
 *   'User age must be at least 18 years old',
 *   (age: number) => age >= 18 ? ok(age) : err('INVALID_AGE')
 * );
 * // ageValue: Value<number, 'INVALID_AGE'>.
 * const result = ageValue(21); // ok(21).
 * ```
 *
 * @example
 * ```ts
 * // value-003: Complex value validation with multiple checks.
 * const emailValue = value(
 *   'Email address validation',
 *   (email: string) => {
 *     if (!email.includes('@')) return err('INVALID_EMAIL');
 *     if (email.length < 5) return err('EMAIL_TOO_SHORT');
 *     return ok(email);
 *   }
 * );
 * // emailValue: Value<string, 'INVALID_EMAIL' | 'EMAIL_TOO_SHORT'>.
 * const validEmail = emailValue('user@example.com'); // ok('user@example.com').
 * const invalidEmail = emailValue('invalid'); // err('INVALID_EMAIL').
 * ```
 *
 * @example
 * ```ts
 * // value-004: Value validation with type safety and bounds.
 * const ageValue = value(
 *   'Age validation with bounds',
 *   (age: number) => {
 *     if (age < 0) return err('NEGATIVE_AGE');
 *     if (age > 150) return err('AGE_TOO_HIGH');
 *     return ok(age);
 *   }
 * );
 * // ageValue: Value<number, 'NEGATIVE_AGE' | 'AGE_TOO_HIGH'>.
 * const result = ageValue(25); // ok(25).
 * // const error = ageValue('25'); // TypeScript error.
 * ```
 *
 * @example
 * ```ts
 * // value-005: Value validation with custom error types.
 * const emailValue = value(
 *   'Email format validation',
 *   (email: string) => {
 *     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
 *     return emailRegex.test(email) ? ok(email) : err('INVALID_EMAIL_FORMAT');
 *   }
 * );
 * // emailValue: Value<string, 'INVALID_EMAIL_FORMAT'>.
 * const validEmail = emailValue('user@example.com'); // ok('user@example.com').
 * const invalidEmail = emailValue('invalid-email'); // err('INVALID_EMAIL_FORMAT').
 * ```
 *
 * @public
 */
const value: ValueDefinition = <T, E>(
  ...args: [ValueFunction<T, E>] | [string, ValueFunction<T, E>] | [(input: T) => Result<T, E>]
): Value<T, E> => {
  const doc = typeof args[0] === 'string' ? args[0] : undefined;
  const validator = typeof args[0] === 'function' ? args[0] : (args[1] as ValueFunction<T, E>);
  const valueWrapper = (input: T): Result<T, E> => validator(input);

  // Create the value element with metadata using the element function.
  const valueObject = Object.assign(valueWrapper, {
    validator,
  });

  return element(valueObject, {
    hash: hash(doc, validator),
    tag: 'Value',
    doc,
  }) as Value<T, E>;
};

/**
 * Guard check to determine if the given value is a value wrapper.
 *
 * @param value - The value to check.
 * @returns True if the value is a value wrapper, false otherwise.
 *
 * @see {@link Value} for the value wrapper type.
 * @see {@link value} for creating value wrappers.
 *
 * @example
 * ```ts
 * // value-006: Check if a value is a value wrapper.
 * const ageValue = value((age: number) => age >= 18 ? ok(age) : err('INVALID_AGE'));
 * const isAgeValue = isValue(ageValue); // true.
 * ```
 *
 * @example
 * ```ts
 * // value-007: Check if a regular function is not a value wrapper.
 * const regularFunction = (age: number) => age >= 18 ? ok(age) : err('INVALID_AGE');
 * const isValueWrapper = isValue(regularFunction); // false.
 * ```
 *
 * @example
 * ```ts
 * // value-008: Check if other types are not value wrappers.
 * const string = 'hello';
 * const number = 42;
 * const object = { age: 18 };
 *
 * const isStringValue = isValue(string); // false.
 * const isNumberValue = isValue(number); // false.
 * const isObjectValue = isValue(object); // false.
 * ```
 *
 * @public
 */
const isValue = (value: unknown): value is Value<Any, Any> =>
  typeof value === 'function' && isElement(value, 'Value');

export type { Value };
export { value, isValue };
