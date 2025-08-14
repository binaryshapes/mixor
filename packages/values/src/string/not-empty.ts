import { err, ok, rule } from '@mixor/core';

import type { StringValueError } from './string';

/**
 * Result error type related to the string `notEmpty` rule.
 *
 * @internal
 */
type IsEmpty = StringValueError<'IsEmptyError', 'notEmpty'>;

/**
 * Instance of the `IsEmpty` error type.
 *
 * @internal
 */
const IsEmpty: IsEmpty = {
  code: 'IsEmptyError',
  context: 'StringValue',
  origin: 'notEmpty',
  message: 'String should not be empty',
};

/**
 * Value rule that validates that the value is not empty.
 *
 * @param value - The string value to validate.
 * @returns A result indicating whether the value is not empty.
 *
 * @public
 */
const notEmpty = rule((value: string) => (value.trim().length !== 0 ? ok(value) : err(IsEmpty)));

export { notEmpty };
