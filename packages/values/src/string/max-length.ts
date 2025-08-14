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
 * Value rule that validates that the value has a maximum length.
 *
 * @param maxLength - The maximum length of the value.
 * @returns A result indicating whether the value has a maximum length.
 *
 * @public
 */
const maxLength = (maxLength: number) =>
  rule((value: string) => (value.length <= maxLength ? ok(value) : err(TooLong)));

export { maxLength };
