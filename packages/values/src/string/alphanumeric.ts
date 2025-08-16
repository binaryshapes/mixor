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
 * Creates a value rule function that validates string values contain only alphanumeric characters.
 *
 * @remarks
 * An alphanumeric string is a string that contains only letters (a-z, A-Z) and numbers (0-9).
 * It rejects spaces, symbols, and special characters.
 *
 * @returns A rule function that validates that the value contains only alphanumeric characters.
 * This function returns a Result type with the value if it contains only letters and numbers, or an
 * error if it contains other characters.
 *
 * @public
 */
const alphanumeric = () =>
  rule((value: string) => (alphanumericRegex.test(value) ? ok(value) : err(NotAlphanumeric)));

export { alphanumeric };
