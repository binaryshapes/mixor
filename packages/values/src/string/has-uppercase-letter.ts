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
 * Creates a rule function that checks whether a string contains at least one uppercase letter.
 *
 * @remarks
 * A string is considered valid if it contains the given number of uppercase letters. For
 * example, `hasUppercaseLetter(2)` will accept strings that contain at least two
 * uppercase letters.
 *
 * @param n - Minimum number of uppercase letters to check for.
 * @returns A rule function that returns a Result containing the value if it contains
 * the required number of uppercase letters, or an error otherwise.
 *
 * @public
 */
const hasUppercaseLetter = (n = 1) =>
  rule((value: string) => {
    const uppercase = value.match(/[A-Z]/g);
    return uppercase?.length && uppercase.length >= n ? ok(value) : err(NotUppercase);
  });

export { hasUppercaseLetter };
