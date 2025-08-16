import { err, ok, rule } from '@mixor/core';

import type { StringValueError } from './string';

/**
 * Result error type related to the string `alphanumeric` rule.
 *
 * @internal
 */
type NotAlphanumeric = StringValueError<'NotAlphanumericError', 'alphanumeric'>;

/**
 * Instance of the `NotAlphanumeric` error type.
 *
 * @internal
 */
const NotAlphanumeric: NotAlphanumeric = {
  code: 'NotAlphanumericError',
  context: 'StringValue',
  origin: 'alphanumeric',
  message: 'Value contains only alphanumeric characters',
};

// Regular expression for alphanumeric validation (from Zod source code).
const alphanumericRegex = /^[a-zA-Z0-9]+$/;

/**
 * Creates a rule function that checks whether a string contains only alphanumeric characters.
 *
 * @remarks
 * An alphanumeric string contains only letters (a-z, A-Z) and numbers (0-9). Strings
 * with spaces, symbols, or special characters are rejected.
 *
 * @returns A rule function that returns a Result containing the value if it contains only
 * letters and numbers, or an error otherwise.
 *
 * @public
 */
const alphanumeric = () =>
  rule((value: string) => (alphanumericRegex.test(value) ? ok(value) : err(NotAlphanumeric)));

export { alphanumeric };
