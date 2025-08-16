import { err, ok, rule } from '@mixor/core';

import type { StringValueError } from './string';

/**
 * Result error type related to the string `isoDate` rule.
 *
 * @internal
 */
type InvalidDate = StringValueError<'InvalidDateError', 'isoDate'>;

/**
 * Instance of the `InvalidDate` error type.
 *
 * @internal
 */
const InvalidDate: InvalidDate = {
  code: 'InvalidDateError',
  context: 'StringValue',
  origin: 'isoDate',
  message: 'Value is not a valid ISO date',
};

// Regular expression for ISO date validation (from Zod source code).
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Creates a rule function that checks whether a string is a valid ISO date.
 *
 * @remarks
 * A valid ISO date string follows the format YYYY-MM-DD (e.g., "2021-01-01").
 * Strings that don't match this format or represent invalid dates are rejected.
 *
 * @returns A rule function that returns a Result containing the value if it is a valid ISO date,
 * or an error otherwise.
 *
 * @public
 */
const isoDate = () =>
  rule((value: string) => (dateRegex.test(value) ? ok(value) : err(InvalidDate)));

export { isoDate };
