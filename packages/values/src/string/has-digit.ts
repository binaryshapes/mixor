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
 * Creates a rule function that checks whether a string contains at least one digit.
 *
 * @remarks
 * A string is considered valid if it contains the given number of digits. For example,
 * `hasDigit(2)` will accept strings that contain at least two digits.
 *
 * @param n - Minimum number of digits to check for.
 * @returns A rule function that returns a Result containing the value if it contains
 * the required number of digits, or an error otherwise.
 *
 * @public
 */
const hasDigit = (n = 1) =>
  rule((value: string) => {
    const digits = value.match(/\d/g);
    return digits?.length && digits.length >= n ? ok(value) : err(NotDigit);
  });

export { hasDigit };
