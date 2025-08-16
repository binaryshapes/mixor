import { err, ok, rule } from '@mixor/core';

import type { StringValueError } from './string';

/**
 * Result error type related to the string `isoDatetime` rule.
 *
 * @internal
 */
type InvalidDateTime = StringValueError<'InvalidDateTimeError', 'isoDatetime'>;

/**
 * Instance of the `InvalidDateTime` error type.
 *
 * @internal
 */
const InvalidDateTime: InvalidDateTime = {
  code: 'InvalidDateTimeError',
  context: 'StringValue',
  origin: 'isoDatetime',
  message: 'Value is not a valid ISO date and time',
};

// Regular expression for ISO date time validation (from Zod source code).
const datetimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})?$/;

/**
 * Creates a rule function that checks whether a string is a valid ISO date and time.
 *
 * @remarks
 * A valid ISO date time string follows the format YYYY-MM-DDTHH:MM:SS (e.g., "2021-01-01T12:34:56").
 * It can include milliseconds and timezone information. Strings that don't match this format are rejected.
 *
 * @returns A rule function that returns a Result containing the value if it is a valid ISO date and time,
 * or an error otherwise.
 *
 * @public
 */
const isoDatetime = () =>
  rule((value: string) => (datetimeRegex.test(value) ? ok(value) : err(InvalidDateTime)));

export { isoDatetime };
