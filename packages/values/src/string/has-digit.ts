import { err, ok, rule } from '@mixor/core';

import type { StringValueError } from './string';

/**
 * Result error type related to the string `hasDigit` rule.
 *
 * @internal
 */
type NotDigit = StringValueError<'NotDigitError', 'hasDigit'>;

/**
 * Instance of the `NotDigit` error type.
 *
 * @internal
 */
const NotDigit: NotDigit = {
  code: 'NotDigitError',
  context: 'StringValue',
  origin: 'hasDigit',
  message: 'Value does not contain required digits',
};

/**
 * Value rule that validates that the value contains a number.
 *
 * @param n - Minimum number of digits to check for.
 * @returns A result indicating whether the value contains a number.
 *
 * @public
 */
const hasDigit = (n = 1) =>
  rule((value: string) => {
    const digits = value.match(/\d/g);
    return digits?.length && digits.length >= n ? ok(value) : err(NotDigit);
  });

export { hasDigit };
