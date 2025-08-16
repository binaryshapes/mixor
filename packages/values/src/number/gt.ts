import { err, ok, rule } from '@mixor/core';

import type { NumberValueError } from './number';

/**
 * Result error type related to the number `gt` rule.
 *
 * @internal
 */
type NotGreaterThan = NumberValueError<'NotGreaterThanError', 'gt'>;

/**
 * Instance of the `NotGreaterThan` error type.
 *
 * @internal
 */
const NotGreaterThan: NotGreaterThan = {
  code: 'NotGreaterThanError',
  context: 'NumberValue',
  origin: 'gt',
  message: 'Number is not greater than the specified value',
};

/**
 * Creates a rule function that checks whether a number is greater than a specified value.
 *
 * @remarks
 * A number is considered valid if it is strictly greater than the specified value.
 * For example, `gt(5)` will accept numbers like 6, 7, 8, etc., but reject 5.
 *
 * @param threshold - The value that the number must be greater than.
 * @returns A rule function that returns a Result containing the value if it is greater
 * than the threshold, or an error otherwise.
 *
 * @public
 */
const gt = (threshold: number) =>
  rule((value: number) => (value > threshold ? ok(value) : err(NotGreaterThan)));

export { gt };
