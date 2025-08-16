import { err, ok, rule } from '@mixor/core';

import type { StringValueError } from './string';

/**
 * Result error type related to the string `maxLength` rule.
 *
 * @internal
 */
type TooLong = StringValueError<'TooLongError', 'maxLength'>;

/**
 * Instance of the `TooLong` error type.
 *
 * @internal
 */
const TooLong: TooLong = {
  code: 'TooLongError',
  context: 'StringValue',
  origin: 'maxLength',
  message: 'String length exceeds maximum',
};

/**
 * Creates a rule function that checks whether a string has a maximum length.
 *
 * @remarks
 * A string is considered valid if it has fewer or equal characters than the maximum length.
 *
 * @param maxLength - The maximum length of the value.
 * @returns A rule function that returns a Result containing the value if it meets
 * the length requirement, or an error otherwise.
 *
 * @public
 */
const maxLength = (maxLength: number) =>
  rule((value: string) => (value.length <= maxLength ? ok(value) : err(TooLong)));

export { maxLength };
