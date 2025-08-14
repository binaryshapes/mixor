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
 * Value rule that validates that the value at least contains one uppercase letter.
 *
 * @param n - Minimum number of uppercase letters to check for.
 * @returns A result indicating whether the value contains at least one uppercase letter.
 *
 * @public
 */
const hasUppercaseLetter = (n = 1) =>
  rule((value: string) => {
    const uppercase = value.match(/[A-Z]/g);
    return uppercase?.length && uppercase.length >= n ? ok(value) : err(NotUppercase);
  });

export { hasUppercaseLetter };
