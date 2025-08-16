import { err, ok, rule } from '@mixor/core';

import type { StringValueError } from './string';

/**
 * Result error type related to the string `hasLowercaseLetter` rule.
 *
 * @internal
 */
type NotLowercase = StringValueError<'NotLowercaseError', 'hasLowercaseLetter'>;

/**
 * Instance of the `NotLowercase` error type.
 *
 * @internal
 */
const NotLowercase: NotLowercase = {
  code: 'NotLowercaseError',
  context: 'StringValue',
  origin: 'hasLowercaseLetter',
  message: 'Value does not contain required lowercase letters',
};

/**
 * Creates a value rule function that validates string values contain at least one lowercase letter.
 *
 * @remarks
 * A string is considered okay if it contains the given number of lowercase letters. i.e.
 * `hasLowercaseLetter(2)` will return true if the string contains at least two lowercase letters.
 *
 * @param n - Minimum number of lowercase letters to check for.
 * @returns A rule function that validates that the value contains the given number of lowercase
 * letters. This function returns a Result type with the value if it contains the given number of
 * lowercase letters, or an error if it does not.
 *
 * @public
 */
const hasLowercaseLetter = (n = 1) =>
  rule((value: string) => {
    const lowercase = value.match(/[a-z]/g);
    return lowercase?.length && lowercase.length >= n ? ok(value) : err(NotLowercase);
  });

export { hasLowercaseLetter };
