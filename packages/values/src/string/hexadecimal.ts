import { err, ok, rule } from '@mixor/core';

import type { StringValueError } from './string';

/**
 * Result error type related to the string `hexadecimal` rule.
 *
 * @internal
 */
type NotHexadecimal = StringValueError<'NotHexadecimalError', 'hexadecimal'>;

/**
 * Instance of the `NotHexadecimal` error type.
 *
 * @internal
 */
const NotHexadecimal: NotHexadecimal = {
  code: 'NotHexadecimalError',
  context: 'StringValue',
  origin: 'hexadecimal',
  message: 'Value is not a valid hexadecimal string',
};

// Regular expression for hexadecimal validation (from Zod source code).
const hex = /^[0-9a-fA-F]+$/;

/**
 * Creates a rule function that checks whether a string is a valid hexadecimal string.
 *
 * @remarks
 * A valid hexadecimal string contains only hexadecimal characters (0-9, A-F, a-f).
 * Strings that don't match this format are rejected.
 *
 * @returns A rule function that returns a Result containing the value if it is a valid
 * hexadecimal string, or an error otherwise.
 *
 * @public
 */
const hexadecimal = () =>
  rule((value: string) => (hex.test(value) ? ok(value) : err(NotHexadecimal)));

export { hexadecimal };
