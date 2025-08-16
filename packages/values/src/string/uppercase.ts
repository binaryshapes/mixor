import { err, ok, rule } from '@mixor/core';

import type { StringValueError } from './string';

/**
 * Result error type related to the string `uppercase` rule.
 *
 * @internal
 */
type NotUpperCase = StringValueError<'NotUpperCaseError', 'uppercase'>;

/**
 * Instance of the `NotUpperCase` error type.
 *
 * @internal
 */
const NotUpperCase: NotUpperCase = {
  code: 'NotUpperCaseError',
  context: 'StringValue',
  origin: 'uppercase',
  message: 'Value contains only uppercase letters',
};

// Regular expression for uppercase validation (from Zod source code).
const uppercaseRegex = /^[A-Z]+$/;

/**
 * Creates a rule function that checks whether a string contains only uppercase letters.
 *
 * @remarks
 * A valid uppercase string contains only uppercase letters (A-Z). It rejects lowercase
 * letters, numbers, spaces, symbols, and special characters.
 *
 * @returns A rule function that returns a Result containing the value if it contains
 * only uppercase letters, or an error otherwise.
 *
 * @public
 */
const uppercase = () =>
  rule((value: string) => (uppercaseRegex.test(value) ? ok(value) : err(NotUpperCase)));

export { uppercase };
