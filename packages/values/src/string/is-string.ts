import { err, ok, rule } from '@mixor/core';

import type { StringValueError } from './string';

/**
 * Result error type related to the string `isString` rule.
 *
 * @internal
 */
type NotString = StringValueError<'NotStringError', 'isString'>;

/**
 * Instance of the `NotString` error type.
 *
 * @internal
 */
const NotString: NotString = {
  code: 'NotStringError',
  context: 'StringValue',
  origin: 'isString',
  message: 'Value is not a string',
};

/**
 * Value rule that validates that the value is a string.
 *
 * @param value - The unknown value to validate.
 * @returns A result indicating whether the value is a string.
 *
 * @public
 */
const isString = rule((value: unknown) => (typeof value === 'string' ? ok(value) : err(NotString)));

export { isString };
