/*
 * This file is part of the Mixor project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { ErrorMode } from './_err';
import type { Any } from './generics';
import { pipe } from './pipe';
import { type Result } from './result';
import { type Traceable, type TraceableMeta, isTraceable, traceInfo, traceable } from './trace';

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
 * Extended metadata for value validation.
 *
 * @internal
 */
type ValueMeta<T> = TraceableMeta<{
  /** Example of valid input. */
  example: T;
}>;

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
type ValueRule<T, E> = Traceable<
  'ValueRule',
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
 * @internal
 */
type Value<T, E> = Traceable<
  'Value',
  {
    (input: T, mode?: ErrorMode): Result<T, E>;
  },
  ValueMeta<T>
>;

/**
 * Create a value rule for validation.
 *
 * @typeParam T - The type of the value to validate.
 * @typeParam E - The type of the error.
 * @param rule - The validation function to create.
 * @returns A new traceable value rule.
 *
 * @example
 * ```ts
 * // value-001: Basic rule creation for string validation.
 * const EmailNotEmpty = rule((email: string) =>
 *   email.length > 0 ? ok(email) : err('EMPTY_EMAIL')
 * );
 * const result = EmailNotEmpty('test@example.com');
 * // result: Ok('test@example.com').
 * ```
 *
 * @example
 * ```ts
 * // value-002: Rule with custom error handling.
 * const EmailShouldBeCorporate = rule((email: string) =>
 *   email.includes('@company.com') ? ok(email) : err('NOT_CORPORATE')
 * );
 * const result = EmailShouldBeCorporate('user@company.com');
 * // result: Ok('user@company.com').
 * ```
 *
 * @public
 */
const rule = <T, E>(rule: ValueFunction<T, E>) => traceable('ValueRule', rule) as ValueRule<T, E>;

/**
 * Creates a value validator that combines multiple rules for field validation.
 * Combines rules using function composition for validation.
 *
 * @param rules - The validation rules to apply to the value.
 * @returns A new traceable value validator.
 *
 * @example
 * ```ts
 * // value-003: Basic value validation with multiple rules.
 * const EmailNotEmpty = rule((email: string) =>
 *   email.length > 0 ? ok(email) : err('EMPTY_EMAIL')
 * );
 * const EmailShouldBeCorporate = rule((email: string) =>
 *   email.includes('@company.com') ? ok(email) : err('NOT_CORPORATE')
 * );
 *
 * const UserEmail = value(EmailNotEmpty, EmailShouldBeCorporate);
 * const result = UserEmail('john@company.com');
 * // result: Ok('john@company.com').
 * ```
 *
 * @example
 * ```ts
 * // value-004: Value validation with error handling.
 * const UserEmail = value(EmailNotEmpty, EmailShouldBeCorporate);
 * const result = UserEmail('');
 * if (isOk(result)) {
 *   // unwrap(result): validated email.
 * } else {
 *   // unwrap(result): 'EMPTY_EMAIL'.
 * }
 * ```
 *
 * @example
 * ```ts
 * // value-005: Rule with metadata for better tracing.
 * const EmailNotEmpty = rule((email: string) =>
 *   email.length > 0 ? ok(email) : err('EMPTY_EMAIL')
 * ).meta({
 *   name: 'EmailNotEmpty',
 *   description: 'Validates that email is not empty',
 *   scope: 'UserValidation'
 * });
 * const result = EmailNotEmpty('test@example.com');
 * // result: Ok('test@example.com').
 * ```
 *
 * @example
 * ```ts
 * // value-006: Value validator with metadata for tracing.
 * const EmailNotEmpty = rule((email: string) =>
 *   email.length > 0 ? ok(email) : err('EMPTY_EMAIL')
 * ).meta({
 *   name: 'EmailNotEmpty',
 *   description: 'Validates that email is not empty',
 *   scope: 'UserValidation'
 * });
 * const EmailShouldBeCorporate = rule((email: string) =>
 *   email.includes('@company.com') ? ok(email) : err('NOT_CORPORATE')
 * ).meta({
 *   name: 'EmailShouldBeCorporate',
 *   description: 'Validates that email is corporate',
 *   scope: 'UserValidation'
 * });
 *
 * const UserEmail = value(EmailNotEmpty, EmailShouldBeCorporate).meta({
 *   name: 'UserEmail',
 *   description: 'Complete email validation for users',
 *   scope: 'UserValidation',
 *   example: 'john@company.com'
 * });
 * const result = UserEmail('john@company.com');
 * // result: Ok('john@company.com').
 * ```
 *
 * @public
 */
const value = <T, E>(...rules: ValueRule<T, E>[]) =>
  traceable('Value', (value: T, mode: ErrorMode = 'all') =>
    pipe(mode, ...(rules as [ValueRule<Any, Any>]))(value),
  ) as Value<T, E>;

/**
 * Guard check to determine if the given value is a value validator.
 *
 * @param value - The value to check.
 * @returns True if the value is a value validator, false otherwise.
 *
 * @public
 */
const isValue = (value: unknown): value is Value<Any, Any> =>
  isTraceable(value) && traceInfo(value as Value<Any, Any>).tag === 'Value';

/**
 * Guard check to determine if the given value is a value rule.
 *
 * @param value - The value to check.
 * @returns True if the value is a value rule, false otherwise.
 *
 * @public
 */
const isValueRule = (value: unknown): value is ValueRule<Any, Any> =>
  isTraceable(value) && traceInfo(value as ValueRule<Any, Any>).tag === 'ValueRule';

export type { Value, ValueRule };
export { isValue, isValueRule, rule, value };
