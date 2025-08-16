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
 * Creates a rule function that checks whether a string is not empty.
 *
 * @remarks
 * A string is considered valid if it contains characters after trimming whitespace.
 *
 * @returns A rule function that returns a Result containing the value if it is not
 * empty, or an error otherwise.
 *
 * @public
 */
const notEmpty = () =>
  rule((value: string) => (value.trim().length !== 0 ? ok(value) : err(IsEmpty)));

export { notEmpty };
