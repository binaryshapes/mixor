import { err, ok, rule } from '@mixor/core';

import type { StringValueError } from './string';

/**
 * Result error type related to the string `hasBigIntFormat` rule.
 *
 * @internal
 */
type NotBigInt = StringValueError<'NotBigIntError', 'hasBigIntFormat'>;

/**
 * Instance of the `NotBigInt` error type.
 *
 * @internal
 */
const NotBigInt: NotBigInt = {
  code: 'NotBigIntError',
  context: 'StringValue',
  origin: 'hasBigIntFormat',
  message: 'Value is not a valid BigInt string',
};

// Regular expression for BigInt validation (from Zod source code).
const bigintRegex = /^\d+n?$/;

/**
 * Creates a rule function that checks whether a string has a valid BigInt format.
 *
 * @remarks
 * A valid BigInt string contains only digits and optionally ends with 'n'. Strings
 * with decimal points, letters, or other characters are rejected.
 *
 * @returns A rule function that returns a Result containing the value if it has a
 * valid BigInt format, or an error otherwise.
 *
 * @public
 */
const hasBigIntFormat = () =>
  rule((value: string) => (bigintRegex.test(value) ? ok(value) : err(NotBigInt)));

export { hasBigIntFormat };
