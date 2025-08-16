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
 * Creates a value rule function that validates string values contain at least one digit.
 *
 * @remarks
 * A string is considered okay if it contains the given number of digits. i.e. `hasDigit(2)` will
 * return true if the string contains at least two digits.
 *
 * @param n - Minimum number of digits to check for.
 * @returns A rule function that validates that the value contains the given number of digits. This
 * function returns a Result type with the value if it contains the given number of digits, or an
 * error if it does not.
 *
 * @public
 */
const hasDigit = (n = 1) =>
  rule((value: string) => {
    const digits = value.match(/\d/g);
    return digits?.length && digits.length >= n ? ok(value) : err(NotDigit);
  });

export { hasDigit };
