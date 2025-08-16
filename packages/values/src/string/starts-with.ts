import { err, ok, rule } from '@mixor/core';

import type { StringValueError } from './string';

/**
 * Result error type related to the string `startsWith` rule.
 *
 * @internal
 */
type NotStartsWith = StringValueError<'NotStartsWithError', 'startsWith'>;

/**
 * Instance of the `NotStartsWith` error type.
 *
 * @internal
 */
const NotStartsWith: NotStartsWith = {
  code: 'NotStartsWithError',
  context: 'StringValue',
  origin: 'startsWith',
  message: 'Value does not start with required prefix',
};

/**
 * Creates a value rule function that validates string values start with a specific prefix.
 *
 * @remarks
 * A string starts with a prefix if the prefix is found at the beginning of the string.
 *
 * @param prefix - The prefix to check for.
 * @returns A rule function that validates that the value starts with the prefix.
 * This function returns a Result type with the value if it starts with the prefix, or an
 * error if it does not.
 *
 * @public
 */
const startsWith = (prefix: string) =>
  rule((value: string) => (value.startsWith(prefix) ? ok(value) : err(NotStartsWith)));

export { startsWith };
