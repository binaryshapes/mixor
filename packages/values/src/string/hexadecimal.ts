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
 * Value rule that validates that the value is a valid hexadecimal string.
 *
 * @param value - The string value to validate.
 * @returns A result indicating whether the value is a valid hexadecimal string.
 *
 * @public
 */
const hexadecimal = rule((value: string) => (hex.test(value) ? ok(value) : err(NotHexadecimal)));

export { hexadecimal };
