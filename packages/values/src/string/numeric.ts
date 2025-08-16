import { err, ok, rule } from '@mixor/core';

import type { StringValueError } from './string';

/**
 * Result error type related to the string `numeric` rule.
 *
 * @internal
 */
type NotNumeric = StringValueError<'NotNumericError', 'numeric'>;

/**
 * Instance of the `NotNumeric` error type.
 *
 * @internal
 */
const NotNumeric: NotNumeric = {
  code: 'NotNumericError',
  context: 'StringValue',
  origin: 'numeric',
  message: 'Value is not numeric',
};

// Regular expression for numeric validation (from Zod source code).
const num = /^[0-9]+$/;

/**
 * Creates a rule function that checks whether a string contains only digits.
 *
 * @remarks
 * A valid numeric string contains only digits (0-9). It rejects letters, spaces,
 * symbols, and special characters.
 *
 * @returns A rule function that returns a Result containing the value if it contains
 * only digits, or an error otherwise.
 *
 * @public
 */
const numeric = () => rule((value: string) => (num.test(value) ? ok(value) : err(NotNumeric)));

export { numeric };
