import { err, ok, rule } from '@mixor/core';

import type { StringValueError } from './string';

/**
 * Result error type related to the string `hasUppercaseLetter` rule.
 *
 * @internal
 */
type NotUppercase = StringValueError<'NotUppercaseError', 'hasUppercaseLetter'>;

/**
 * Instance of the `NotUppercase` error type.
 *
 * @internal
 */
const NotUppercase: NotUppercase = {
  code: 'NotUppercaseError',
  context: 'StringValue',
  origin: 'hasUppercaseLetter',
  message: 'Value does not contain required uppercase letters',
};

/**
 * Creates a value rule function that validates string values contain at least one uppercase letter.
 *
 * @remarks
 * A string is considered okay if it contains the given number of uppercase letters. i.e.
 * `hasUppercaseLetter(2)` will return true if the string contains at least two uppercase letters.
 *
 * @param n - Minimum number of uppercase letters to check for.
 * @returns A rule function that validates that the value contains the given number of uppercase
 * letters. This function returns a Result type with the value if it contains the given number of
 * uppercase letters, or an error if it does not.
 *
 * @public
 */
const hasUppercaseLetter = (n = 1) =>
  rule((value: string) => {
    const uppercase = value.match(/[A-Z]/g);
    return uppercase?.length && uppercase.length >= n ? ok(value) : err(NotUppercase);
  });

export { hasUppercaseLetter };
