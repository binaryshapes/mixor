import { err, ok, rule } from '@mixor/core';

import type { StringValueError } from './string';

/**
 * Result error type related to the string `hasNumberFormat` rule.
 *
 * @internal
 */
type NotNumber = StringValueError<'NotNumberError', 'hasNumberFormat'>;

/**
 * Instance of the `NotNumber` error type.
 *
 * @internal
 */
const NotNumber: NotNumber = {
  code: 'NotNumberError',
  context: 'StringValue',
  origin: 'hasNumberFormat',
  message: 'Value is not a valid number string',
};

// Regular expression for number validation (from Zod source code).
const numberRegex = /^-?\d+(?:\.\d+)?/i;

/**
 * Creates a rule function that checks whether a string has a valid number format.
 *
 * @remarks
 * A valid number string represents a number, including integers and decimals. It can
 * start with an optional minus sign and include decimal points.
 *
 * @returns A rule function that returns a Result containing the value if it has a
 * valid number format, or an error otherwise.
 *
 * @public
 */
const hasNumberFormat = () =>
  rule((value: string) => (numberRegex.test(value) ? ok(value) : err(NotNumber)));

export { hasNumberFormat };
