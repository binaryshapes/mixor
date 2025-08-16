import { err, ok, rule } from '@mixor/core';

import type { NumberValueError } from './number';

/**
 * Result error type related to the number `lt` rule.
 *
 * @internal
 */
type NotLessThan = NumberValueError<'NotLessThanError', 'lt'>;

/**
 * Instance of the `NotLessThan` error type.
 *
 * @internal
 */
const NotLessThan: NotLessThan = {
  code: 'NotLessThanError',
  context: 'NumberValue',
  origin: 'lt',
  message: 'Number is not less than the specified value',
};

/**
 * Creates a rule function that checks whether a number is less than a specified value.
 *
 * @remarks
 * A number is considered valid if it is strictly less than the specified value.
 * For example, `lt(10)` will accept numbers like 8, 9, etc., but reject 10.
 *
 * @param threshold - The value that the number must be less than.
 * @returns A rule function that returns a Result containing the value if it is less
 * than the threshold, or an error otherwise.
 *
 * @public
 */
const lt = (threshold: number) =>
  rule((value: number) => (value < threshold ? ok(value) : err(NotLessThan)));

export { lt };
