import { type Result, type ResultError, err, ok, rule } from '@mixor/core';

/**
 * Result error type for the `isString` rule.
 *
 * @remarks
 * This error type is used to represent the error that occurs when the value is not a string.
 *
 * @public
 */
type NotString = ResultError<'NOT_STRING', 'isString'>;

/**
 * Validates that the value is a string.
 *
 * @param value - The unknown value to validate.
 * @returns A result indicating whether the value is a string.
 *
 * @example
 * ```ts
 * // is-string-001: Validate string value.
 * const result = isString('hello');
 * // result: ok('hello').
 * ```
 *
 * @example
 * ```ts
 * // is-string-002: Reject number value.
 * const result = isString(1.23);
 * // result: err(NotString).
 * ```
 *
 * @example
 * ```ts
 * // is-string-003: Reject boolean value.
 * const result = isString(true);
 * // result: err(NotString).
 * ```
 *
 * @example
 * ```ts
 * // is-string-004: Reject null value.
 * const result = isString(null);
 * // result: err(NotString).
 * ```
 *
 * @example
 * ```ts
 * // is-string-005: Reject undefined value.
 * const result = isString(undefined);
 * // result: err(NotString).
 * ```
 *
 * @example
 * ```ts
 * // is-string-006: Reject object value.
 * const result = isString({});
 * // result: err(NotString).
 * ```
 *
 * @example
 * ```ts
 * // is-string-007: Reject array value.
 * const result = isString([]);
 * // result: err(NotString).
 * ```
 *
 * @public
 */
const isString = rule(
  (value: unknown): Result<string, NotString> =>
    typeof value === 'string'
      ? ok(value)
      : err({
          code: 'NOT_STRING',
          context: 'isString',
          message: `${value} is not string`,
        }),
);

export { isString };
