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
 * Creates a value rule function that validates string values are numeric.
 *
 * @remarks
 * A numeric string is a string that contains only digits.
 *
 * @returns A rule function that validates that the value is a numeric string.
 * This function returns a Result type with the value if it is a numeric string, or an
 * error if it is not.
 *
 * @public
 */
const numeric = () => rule((value: string) => (num.test(value) ? ok(value) : err(NotNumeric)));

export { numeric };
