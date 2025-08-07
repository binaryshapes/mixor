import { type Result, type ResultError, err, ok, rule } from '@mixor/core';

/**
 * Result error type for the `hasMaxLength` rule.
 *
 * @remarks
 * This error type is used to represent the error that occurs when the value is too long.
 *
 * @public
 */
type TooLong = ResultError<'TOO_LONG', 'hasMaxLength'>;

/**
 * Validates that the value has a maximum length.
 *
 * @param maxLength - The maximum length of the value.
 * @returns A result indicating whether the value has a maximum length.
 *
 * @example
 * ```ts
 * // has-max-length-001: Validate string with maximum length.
 * const result = hasMaxLength(10)('short');
 * // result: ok('short').
 * ```
 *
 * @example
 * ```ts
 * // has-max-length-002: Reject string exceeding maximum length.
 * const result = hasMaxLength(10)('too long string');
 * // result: err(TooLong).
 * ```
 *
 * @public
 */
const hasMaxLength = (maxLength: number) =>
  rule(
    (value: string): Result<string, TooLong> =>
      value.length <= maxLength
        ? ok(value)
        : err({
            code: 'TOO_LONG',
            context: 'hasMaxLength',
            message: `String length ${value.length} exceeds maximum ${maxLength}`,
          }),
  );

export { hasMaxLength };
