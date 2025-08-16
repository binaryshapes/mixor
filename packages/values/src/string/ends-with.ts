import { err, ok, rule } from '@mixor/core';

import type { StringValueError } from './string';

/**
 * Result error type related to the string `endsWith` rule.
 *
 * @internal
 */
type NotEndsWith = StringValueError<'NotEndsWithError', 'endsWith'>;

/**
 * Instance of the `NotEndsWith` error type.
 *
 * @internal
 */
const NotEndsWith: NotEndsWith = {
  code: 'NotEndsWithError',
  context: 'StringValue',
  origin: 'endsWith',
  message: 'Value does not end with required suffix',
};

/**
 * Creates a rule function that checks whether a string ends with a specific suffix.
 *
 * @remarks
 * A string ends with a suffix if the suffix is found at the end of the string.
 *
 * @param suffix - The suffix to check for.
 * @returns A rule function that returns a Result containing the value if it ends with
 * the suffix, or an error otherwise.
 *
 * @public
 */
const endsWith = (suffix: string) =>
  rule((value: string) => (value.endsWith(suffix) ? ok(value) : err(NotEndsWith)));

export { endsWith };
