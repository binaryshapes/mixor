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
 * Creates a value rule function that validates string values have a maximum length.
 *
 * @remarks
 * A string is considered too long if it has more characters than the maximum length.
 *
 * @param maxLength - The maximum length of the value.
 * @returns A rule function that validates that the value has a maximum length.
 * This function returns a Result type with the value if it has a maximum length, or an
 * error if it does not.
 *
 * @public
 */
const maxLength = (maxLength: number) =>
  rule((value: string) => (value.length <= maxLength ? ok(value) : err(TooLong)));

export { maxLength };
