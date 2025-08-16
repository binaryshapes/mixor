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
 * Creates a rule function that checks whether a string contains at least one lowercase letter.
 *
 * @remarks
 * A string is considered valid if it contains the given number of lowercase letters. For
 * example, `hasLowercaseLetter(2)` will accept strings that contain at least two
 * lowercase letters.
 *
 * @param n - Minimum number of lowercase letters to check for.
 * @returns A rule function that returns a Result containing the value if it contains
 * the required number of lowercase letters, or an error otherwise.
 *
 * @public
 */
const hasLowercaseLetter = (n = 1) =>
  rule((value: string) => {
    const lowercase = value.match(/[a-z]/g);
    return lowercase?.length && lowercase.length >= n ? ok(value) : err(NotLowercase);
  });

export { hasLowercaseLetter };
