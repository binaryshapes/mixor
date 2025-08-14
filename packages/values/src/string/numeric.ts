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
 * Value rule that validates that the value is a numeric string.
 *
 * @param value - The string value to validate.
 * @returns A result indicating whether the value is a numeric string.
 *
 * @public
 */
const numeric = rule((value: string) => (num.test(value) ? ok(value) : err(NotNumeric)));

export { numeric };
