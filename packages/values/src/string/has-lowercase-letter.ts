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
 * Value rule that validates that the value at least contains one lowercase letter.
 *
 * @param n - Minimum number of lowercase letters to check for.
 * @returns A result indicating whether the value contains at least one lowercase letter.
 *
 * @public
 */
const hasLowercaseLetter = (n = 1) =>
  rule((value: string) => {
    const lowercase = value.match(/[a-z]/g);
    return lowercase?.length && lowercase.length >= n ? ok(value) : err(NotLowercase);
  });

export { hasLowercaseLetter };
