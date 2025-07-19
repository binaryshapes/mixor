/*
 * This file is part of the Mixor project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
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
 * @internal
 */
type ValueFunction<T, E> = (value: T) => Result<T, E>;

/**
 * A value wrapper that provides individual field validation.
 *
 * @typeParam T - The type of the value to validate.
 * @typeParam E - The type of the error.
 *
 * @example
 * ```ts
 * // Create a value validator for age.
 * const ageValue = value((age: number) => age >= 18 ? ok(age) : err('INVALID_AGE'));
 *
 * // Validate individual age values.
 * const validAge = ageValue(21); // ok(21).
 * const invalidAge = ageValue(15); // err('INVALID_AGE').
 * ```
 *
 * @public
 */
interface Value<T, E> {
  /**
   * The tag of the value wrapper.
   *
   * @public
   */
  readonly _tag: 'Value';

  /**
   * The hash of the value wrapper.
   *
   * @public
   */
  readonly _hash: string;

  /**
   * The documentation of this value wrapper (optional).
   *
   * @public
   */
  readonly _doc?: string;

  /**
   * Validates a single value using the provided validation function.
   *
   * @param input - The value to validate.
   * @returns A result containing the validated value or an error.
   *
   * @example
   * ```ts
   * const nameValue = value((name: string) =>
   *   name.length > 0 ? ok(name) : err('EMPTY_NAME')
   * );
   *
   * const result = nameValue('John'); // ok('John').
   * ```
   *
   * @public
   */
  (input: T): Result<T, E>;

  /**
   * The validation function used by this value wrapper.
   *
   * @public
   */
  readonly validator: ValueFunction<T, E>;
}

/**
 * Interface for the value function overloads.
 *
 * @public
 */
interface ValueDefinition {
  /**
   * Creates a value wrapper for individual field validation.
   * It provides a simple interface for single-value validation.
   *
   * @param validator - The validation function to wrap.
   * @returns A value wrapper that can validate individual values.
   *
   * @example
   * ```ts
   * // Basic value validation.
   * const nameValue = value((name: string) =>
   *   name.length > 0 ? ok(name) : err('EMPTY_NAME')
   * );
   *
   * const result = nameValue('John'); // ok('John').
   * ```
   *
   * @public
   */
  <T, E>(validator: ValueFunction<T, E>): Value<T, E>;

  /**
   * Creates a value wrapper for individual field validation with documentation.
   * It provides a simple interface for single-value validation.
   *
   * @param doc - Documentation of the value being validated.
   * @param validator - The validation function to wrap.
   * @returns A value wrapper that can validate individual values.
   *
   * @example
   * ```ts
   * // Value validation with documentation.
   * const ageValue = value(
   *   'User age must be at least 18 years old',
   *   (age: number) => age >= 18 ? ok(age) : err('INVALID_AGE')
   * );
   *
   * const result = ageValue(21); // ok(21).
   * console.log(ageValue.doc); // 'User age must be at least 18 years old'.
   * ```
   *
   * @example
   * ```ts
   * // Complex value validation.
   * const emailValue = value(
   *   'Email address validation',
   *   (email: string) => {
   *     if (!email.includes('@')) return err('INVALID_EMAIL');
   *     if (email.length < 5) return err('EMAIL_TOO_SHORT');
   *     return ok(email);
   *   }
   * );
   *
   * const validEmail = emailValue('user@example.com'); // ok('user@example.com').
   * const invalidEmail = emailValue('invalid'); // err('INVALID_EMAIL').
   * ```
   *
   * @example
   * ```ts
   * // Value validation with type safety.
   * const ageValue = value(
   *   'Age validation with bounds',
   *   (age: number) => {
   *     if (age < 0) return err('NEGATIVE_AGE');
   *     if (age > 150) return err('AGE_TOO_HIGH');
   *     return ok(age);
   *   }
   * );
   *
   * // TypeScript will enforce the correct input type.
   * const result = ageValue(25); // ok(25).
   * // const error = ageValue('25'); // TypeScript error.
   * ```
   *
   * @example
   * ```ts
   * // Value validation with custom error types.
   * const emailValue = value(
   *   'Email format validation',
   *   (email: string) => {
   *     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
   *     return emailRegex.test(email) ? ok(email) : err('INVALID_EMAIL_FORMAT');
   *   }
   * );
   *
   * const validEmail = emailValue('user@example.com'); // ok('user@example.com').
   * const invalidEmail = emailValue('invalid-email'); // err('INVALID_EMAIL_FORMAT').
   * ```
   *
   * @example
   * ```ts
   * // Integration with builder for password validation.
   * const passwordBuilder = builder({
   *   hasUppercase: (value: string) => /[A-Z]/.test(value) ? ok(value) : err('NO_UPPERCASE'),
   *   minLength: (min: number) => (value: string) => value.length >= min ? ok(value) : err('TOO_SHORT'),
   * });
   *
   * const passwordValidator = passwordBuilder.hasUppercase().minLength(8);
   * const passwordValue = value(
   *   'Password strength validation',
   *   (password: string) => passwordValidator.build('strict')(password)
   * );
   *
   * const validPassword = passwordValue('SecurePass'); // ok('SecurePass').
   * const weakPassword = passwordValue('weak'); // err('NO_UPPERCASE').
   * ```
   *
   * @public
   */
  <T, E>(doc: string, validator: ValueFunction<T, E>): Value<T, E>;

  /**
   * Creates a value wrapper from a function that returns a Result.
   * This overload is specifically designed to preserve type inference
   * when passing functions that return Result types.
   *
   * @param fn - A function that takes any input and returns a Result.
   * @returns A value wrapper with preserved type inference.
   *
   * @public
   */
  <T, E>(fn: (input: T) => Result<T, E>): Value<T, E>;
}
const value: ValueDefinition = <T, E>(
  ...args: [ValueFunction<T, E>] | [string, ValueFunction<T, E>] | [(input: T) => Result<T, E>]
): Value<T, E> => {
  const doc = typeof args[0] === 'string' ? args[0] : undefined;
  const validator = typeof args[0] === 'function' ? args[0] : (args[1] as ValueFunction<T, E>);
  const valueWrapper = (input: T): Result<T, E> => validator(input);

  // Attach the validator function to the wrapper for introspection.
  return Object.assign(valueWrapper, {
    validator,
    _tag: 'Value',
    _hash: hash(doc, validator),
    _doc: doc,
  }) as Value<T, E>;
};

/**
 * Guard check to determine if the given value is a value wrapper.
 * @param value - The value to check.
 * @returns True if the value is a value wrapper, false otherwise.
 *
 * @example
 * ```ts
 * // Check if a value is a value wrapper.
 * const ageValue = value((age: number) => age >= 18 ? ok(age) : err('INVALID_AGE'));
 * const isAgeValue = isValue(ageValue); // true.
 * ```
 *
 * @example
 * ```ts
 * // Check if a regular function is not a value wrapper.
 * const regularFunction = (age: number) => age >= 18 ? ok(age) : err('INVALID_AGE');
 * const isValueWrapper = isValue(regularFunction); // false.
 * ```
 *
 * @example
 * ```ts
 * // Check if other types are not value wrappers.
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
const isValue = (value: Any): value is Value<Any, Any> =>
  !!value &&
  typeof value === 'function' &&
  '_tag' in value &&
  value._tag === 'Value' &&
  '_hash' in value &&
  value._hash === hash(value.doc, value.validator) &&
  'validator' in value &&
  typeof value.validator === 'function';

export type { Value };
export { value, isValue };
