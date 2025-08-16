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
 * Creates a rule function that checks whether a string is a valid base64 string.
 *
 * @remarks
 * A valid base64 string contains only base64 characters (A-Z, a-z, 0-9, +, /, =).
 * Strings that don't match this format are rejected.
 *
 * @returns A rule function that returns a Result containing the value if it is a valid
 * base64 string, or an error otherwise.
 *
 * @public
 */
const base64 = () =>
  rule((value: string) => (base64Regex.test(value) ? ok(value) : err(NotBase64)));

export { base64 };
