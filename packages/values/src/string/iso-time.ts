import { err, ok, rule } from '@mixor/core';

import type { StringValueError } from './string';

/**
 * Result error type related to the string `isoTime` rule.
 *
 * @internal
 */
type InvalidTime = StringValueError<'InvalidTimeError', 'isoTime'>;

/**
 * Instance of the `InvalidTime` error type.
 *
 * @internal
 */
const InvalidTime: InvalidTime = {
  code: 'InvalidTimeError',
  context: 'StringValue',
  origin: 'isoTime',
  message: 'Value is not a valid ISO time',
};

// Regular expression for ISO time validation (from Zod source code).
const timeRegex = /^\d{2}:\d{2}:\d{2}$/;

/**
 * Creates a rule function that checks whether a string is a valid ISO time.
 *
 * @remarks
 * A valid ISO time string follows the format HH:MM:SS (e.g., "12:34:56").
 * Strings that don't match this format are rejected.
 *
 * @returns A rule function that returns a Result containing the value if it is a valid ISO time,
 * or an error otherwise.
 *
 * @public
 */
const isoTime = () =>
  rule((value: string) => (timeRegex.test(value) ? ok(value) : err(InvalidTime)));

export { isoTime };
