import { type Result, type ResultError, err, ok, rule } from '@mixor/core';

/**
 * Result error type for the `isNotEmpty` rule.
 *
 * @remarks
 * This error type is used to represent the error that occurs when the value is empty.
 *
 * @public
 */
type IsEmpty = ResultError<'IS_EMPTY', 'isNotEmpty'>;

/**
 * Validates that the value is not empty.
 *
 * @param value - The string value to validate.
 * @returns A result indicating whether the value is not empty.
 *
 * @example
 * ```ts
 * // is-not-empty-001: Validate non-empty string.
 * const result = isNotEmpty('hello');
 * // result: ok('hello').
 * ```
 *
 * @example
 * ```ts
 * // is-not-empty-002: Reject empty string.
 * const result = isNotEmpty('');
 * // result: err(IsEmpty).
 * ```
 *
 * @public
 */
const isNotEmpty = rule(
  (value: string): Result<string, IsEmpty> =>
    value.trim().length !== 0
      ? ok(value)
      : err({
          code: 'IS_EMPTY',
          context: 'isNotEmpty',
          message: 'String should not be empty',
        }),
);

export { isNotEmpty };
