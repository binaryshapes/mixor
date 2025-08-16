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
 * Creates a rule function that checks whether a string starts with a specific prefix.
 *
 * @remarks
 * A string is considered valid if it begins with the specified prefix.
 *
 * @param prefix - The prefix to check for.
 * @returns A rule function that returns a Result containing the value if it starts
 * with the prefix, or an error otherwise.
 *
 * @public
 */
const startsWith = (prefix: string) =>
  rule((value: string) => (value.startsWith(prefix) ? ok(value) : err(NotStartsWith)));

export { startsWith };
