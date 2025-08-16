import { err, ok, rule } from '@mixor/core';

import type { NumberValueError } from './number';

/**
 * Result error type related to the number `lte` rule.
 *
 * @internal
 */
type NotLessThanOrEqual = NumberValueError<'NotLessThanOrEqualError', 'lte'>;

/**
 * Instance of the `NotLessThanOrEqual` error type.
 *
 * @internal
 */
const NotLessThanOrEqual: NotLessThanOrEqual = {
  code: 'NotLessThanOrEqualError',
  context: 'NumberValue',
  origin: 'lte',
  message: 'Number is not less than or equal to the specified value',
};

/**
 * Creates a rule function that checks whether a number is less than or equal to a specified value.
 *
 * @remarks
 * A number is considered valid if it is less than or equal to the specified value.
 * For example, `lte(10)` will accept numbers like 8, 9, 10, etc.
 *
 * @param threshold - The value that the number must be less than or equal to.
 * @returns A rule function that returns a Result containing the value if it is less
 * than or equal to the threshold, or an error otherwise.
 *
 * @public
 */
const lte = (threshold: number) =>
  rule((value: number) => (value <= threshold ? ok(value) : err(NotLessThanOrEqual)));

export { lte };
