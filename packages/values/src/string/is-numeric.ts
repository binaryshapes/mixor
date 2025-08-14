import { err, ok, rule } from '@mixor/core';

import type { StringValueError } from './string';

/**
 * Result error type related to the string `isNumeric` rule.
 *
 * @internal
 */
type NotNumeric = StringValueError<'NotNumericError', 'isNumeric'>;

/**
 * Instance of the `NotNumeric` error type.
 *
 * @internal
 */
const NotNumeric: NotNumeric = {
  code: 'NotNumericError',
  context: 'StringValue',
  origin: 'isNumeric',
  message: 'Value is not numeric',
};

// Regular expression for numeric validation (from Zod source code).
const numeric = /^[0-9]+$/;

/**
 * Value rule that validates that the value is a numeric string.
 *
 * @param value - The string value to validate.
 * @returns A result indicating whether the value is a numeric string.
 *
 * @public
 */
const isNumeric = rule((value: string) => (numeric.test(value) ? ok(value) : err(NotNumeric)));

export { isNumeric };
