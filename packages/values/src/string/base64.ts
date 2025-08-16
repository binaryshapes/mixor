import { err, ok, rule } from '@mixor/core';

import type { StringValueError } from './string';

/**
 * Result error type related to the string `base64` rule.
 *
 * @internal
 */
type NotBase64 = StringValueError<'NotBase64Error', 'base64'>;

/**
 * Instance of the `NotBase64` error type.
 *
 * @internal
 */
const NotBase64: NotBase64 = {
  code: 'NotBase64Error',
  context: 'StringValue',
  origin: 'base64',
  message: 'Value is not a valid base64 string',
};

// Regular expression for base64 validation (from Zod source code).
const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/;

/**
 * Creates a value rule function that validates string values are valid base64 strings.
 *
 * @remarks
 * A base64 string is a string that contains only base64 characters. i.e. A-Z, a-z, 0-9, +, /, =.
 *
 * @returns A rule function that validates that the value is a valid base64 string.
 * This function returns a Result type with the value if it is a valid base64 string, or an
 * error if it is not.
 *
 * @public
 */
const base64 = () =>
  rule((value: string) => (base64Regex.test(value) ? ok(value) : err(NotBase64)));

export { base64 };
