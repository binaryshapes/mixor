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
 * Creates a value rule function that validates string values are not empty.
 *
 * @remarks
 * A string is considered empty if it is empty after trimming whitespace.
 *
 * @returns A rule function that validates that the value is not empty.
 * This function returns a Result type with the value if it is not empty, or an
 * error if it is empty.
 *
 * @public
 */
const notEmpty = () =>
  rule((value: string) => (value.trim().length !== 0 ? ok(value) : err(IsEmpty)));

export { notEmpty };
