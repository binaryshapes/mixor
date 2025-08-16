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
 * Creates a value rule function that validates that the value is a string.
 *
 * @returns A rule function that validates that the value is a string.
 * This function returns a Result type with the value if it is a string, or an
 * error if it is not.
 *
 * @public
 */
const isString = () =>
  rule((value: unknown) => (typeof value === 'string' ? ok(value) : err(NotString)));

export { isString };
