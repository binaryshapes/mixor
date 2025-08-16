import { err, ok, rule } from '@mixor/core';

import type { NumberValueError } from './number';

/**
 * Result error type related to the number `range` rule.
 *
 * @internal
 */
type OutOfRange = NumberValueError<'OutOfRangeError', 'range'>;

/**
 * Instance of the `OutOfRange` error type.
 *
 * @internal
 */
const OutOfRange: OutOfRange = {
  code: 'OutOfRangeError',
  context: 'NumberValue',
  origin: 'range',
  message: 'Number is outside the specified range',
};

/**
 * Creates a rule function that checks whether a number is within a specified range.
 *
 * @remarks
 * A number is considered valid if it is greater than or equal to the minimum value
 * and less than or equal to the maximum value. For example, `range(5, 10)` will
 * accept numbers like 5, 6, 7, 8, 9, 10.
 *
 * @param min - The minimum value (inclusive).
 * @param max - The maximum value (inclusive).
 * @returns A rule function that returns a Result containing the value if it is within
 * the range, or an error otherwise.
 *
 * @public
 */
const range = (min: number, max: number) =>
  rule((value: number) => (value >= min && value <= max ? ok(value) : err(OutOfRange)));

export { range };
