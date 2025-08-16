import { err, ok, rule } from '@mixor/core';

import type { StringValueError } from './string';

/**
 * Result error type related to the string `lowercase` rule.
 *
 * @internal
 */
type NotLowerCase = StringValueError<'NotLowerCaseError', 'lowercase'>;

/**
 * Instance of the `NotLowerCase` error type.
 *
 * @internal
 */
const NotLowerCase: NotLowerCase = {
  code: 'NotLowerCaseError',
  context: 'StringValue',
  origin: 'lowercase',
  message: 'Value contains only lowercase letters',
};

// Regular expression for lowercase validation (from Zod source code).
const lowercaseRegex = /^[a-z]+$/;

/**
 * Creates a value rule function that validates string values contain only lowercase letters.
 *
 * @remarks
 * A lowercase string is a string that contains only lowercase letters (a-z).
 * It rejects uppercase letters, numbers, spaces, symbols, and special characters.
 *
 * @returns A rule function that validates that the value contains only lowercase letters.
 * This function returns a Result type with the value if it contains only lowercase letters, or an
 * error if it contains other characters.
 *
 * @public
 */
const lowercase = () =>
  rule((value: string) => (lowercaseRegex.test(value) ? ok(value) : err(NotLowerCase)));

export { lowercase };
