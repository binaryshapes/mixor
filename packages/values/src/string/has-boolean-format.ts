import { err, ok, rule } from '@mixor/core';

import type { StringValueError } from './string';

/**
 * Result error type related to the string `hasBooleanFormat` rule.
 *
 * @internal
 */
type NotBoolean = StringValueError<'NotBooleanError', 'hasBooleanFormat'>;

/**
 * Instance of the `NotBoolean` error type.
 *
 * @internal
 */
const NotBoolean: NotBoolean = {
  code: 'NotBooleanError',
  context: 'StringValue',
  origin: 'hasBooleanFormat',
  message: 'Value is not a valid boolean string',
};

// Regular expression for boolean validation (from Zod source code).
const booleanRegex = /true|false/i;

/**
 * Creates a rule function that checks whether a string has a valid boolean format.
 *
 * @remarks
 * A valid boolean string contains "true" or "false" (case insensitive). Strings
 * with other values or formats are rejected.
 *
 * @returns A rule function that returns a Result containing the value if it has a
 * valid boolean format, or an error otherwise.
 *
 * @public
 */
const hasBooleanFormat = () =>
  rule((value: string) => (booleanRegex.test(value) ? ok(value) : err(NotBoolean)));

export { hasBooleanFormat };
