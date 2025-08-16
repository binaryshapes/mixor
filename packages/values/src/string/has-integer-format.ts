import { err, ok, rule } from '@mixor/core';

import type { StringValueError } from './string';

/**
 * Result error type related to the string `hasIntegerFormat` rule.
 *
 * @internal
 */
type NotInteger = StringValueError<'NotIntegerError', 'hasIntegerFormat'>;

/**
 * Instance of the `NotInteger` error type.
 *
 * @internal
 */
const NotInteger: NotInteger = {
  code: 'NotIntegerError',
  context: 'StringValue',
  origin: 'hasIntegerFormat',
  message: 'Value is not a valid integer string',
};

// Regular expression for integer validation (from Zod source code).
const integerRegex = /^\d+$/;

/**
 * Creates a rule function that checks whether a string has a valid integer format.
 *
 * @remarks
 * A valid integer string contains only digits (0-9). Strings with decimal points,
 * letters, or other characters are rejected.
 *
 * @returns A rule function that returns a Result containing the value if it has a
 * valid integer format, or an error otherwise.
 *
 * @public
 */
const hasIntegerFormat = () =>
  rule((value: string) => (integerRegex.test(value) ? ok(value) : err(NotInteger)));

export { hasIntegerFormat };
