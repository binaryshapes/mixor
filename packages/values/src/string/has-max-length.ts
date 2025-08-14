import { err, ok, rule } from '@mixor/core';

import type { StringValueError } from './string';

/**
 * Result error type related to the string `hasMaxLength` rule.
 *
 * @internal
 */
type TooLong = StringValueError<'TooLongError', 'hasMaxLength'>;

/**
 * Instance of the `TooLong` error type.
 *
 * @internal
 */
const TooLong: TooLong = {
  code: 'TooLongError',
  context: 'StringValue',
  origin: 'hasMaxLength',
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
const hasMaxLength = (maxLength: number) =>
  rule((value: string) => (value.length <= maxLength ? ok(value) : err(TooLong)));

export { hasMaxLength };
