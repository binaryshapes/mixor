import { err, ok, rule } from '@mixor/core';

import type { NumberValueError } from './number';

/**
 * Result error type related to the number `gte` rule.
 *
 * @internal
 */
type NotGreaterThanOrEqual = NumberValueError<'NotGreaterThanOrEqualError', 'gte'>;

/**
 * Instance of the `NotGreaterThanOrEqual` error type.
 *
 * @internal
 */
const NotGreaterThanOrEqual: NotGreaterThanOrEqual = {
  code: 'NotGreaterThanOrEqualError',
  context: 'NumberValue',
  origin: 'gte',
  message: 'Number is not greater than or equal to the specified value',
};

/**
 * Creates a rule function that checks whether a number is greater than or equal to a specified value.
 *
 * @remarks
 * A number is considered valid if it is greater than or equal to the specified value.
 * For example, `gte(5)` will accept numbers like 5, 6, 7, 8, etc.
 *
 * @param threshold - The value that the number must be greater than or equal to.
 * @returns A rule function that returns a Result containing the value if it is greater
 * than or equal to the threshold, or an error otherwise.
 *
 * @public
 */
const gte = (threshold: number) =>
  rule((value: number) => (value >= threshold ? ok(value) : err(NotGreaterThanOrEqual)));

export { gte };
