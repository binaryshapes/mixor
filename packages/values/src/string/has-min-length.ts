import { type Result, type ResultError, err, ok, rule } from '@mixor/core';

/**
 * Result error type for the `hasMinLength` rule.
 *
 * @remarks
 * This error type is used to represent the error that occurs when the value is too short.
 *
 * @public
 */
type TooShort = ResultError<'TOO_SHORT', 'hasMinLength'>;

/**
 * Validates that the value has a minimum length.
 *
 * @param minLength - The minimum length of the value.
 * @returns A result indicating whether the value has a minimum length.
 *
 * @example
 * ```ts
 * // has-min-length-001: Validate string with minimum length.
 * const result = hasMinLength(10)('hello world');
 * // result: ok('hello world').
 * ```
 *
 * @example
 * ```ts
 * // has-min-length-002: Reject string with insufficient length.
 * const result = hasMinLength(10)('short');
 * // result: err(TooShort).
 * ```
 *
 * @public
 */
const hasMinLength = (minLength: number) =>
  rule(
    (value: string): Result<string, TooShort> =>
      value.length >= minLength
        ? ok(value)
        : err({
            code: 'TOO_SHORT',
            context: 'hasMinLength',
            message: `String length ${value.length} is less than minimum ${minLength}`,
          }),
  );

export { hasMinLength };
