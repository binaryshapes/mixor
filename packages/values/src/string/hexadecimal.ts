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
 * Creates a value rule function that validates string values are valid hexadecimal strings.
 *
 * @remarks
 * A hexadecimal string is a string that contains only hexadecimal characters. i.e. 0-9, A-F, a-f.
 *
 * @returns A rule function that validates that the value is a valid hexadecimal string.
 * This function returns a Result type with the value if it is a valid hexadecimal string, or an
 * error if it is not.
 *
 * @public
 */
const hexadecimal = () =>
  rule((value: string) => (hex.test(value) ? ok(value) : err(NotHexadecimal)));

export { hexadecimal };
