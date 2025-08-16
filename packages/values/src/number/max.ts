import { err, ok, rule } from '@mixor/core';

import type { NumberValueError } from './number';

/**
 * Result error type related to the number `max` rule.
 *
 * @internal
 */
type TooLarge = NumberValueError<'TooLargeError', 'max'>;

/**
 * Instance of the `TooLarge` error type.
 *
 * @internal
 */
const TooLarge: TooLarge = {
  code: 'TooLargeError',
  context: 'NumberValue',
  origin: 'max',
  message: 'Number is greater than maximum value',
};

/**
 * Creates a rule function that checks whether a number is less than or equal to a maximum value.
 *
 * @remarks
 * A number is considered valid if it is less than or equal to the specified maximum value.
 * For example, `max(10)` will accept numbers like 8, 9, 10, etc.
 *
 * @param maxValue - The maximum value that the number must be less than or equal to.
 * @returns A rule function that returns a Result containing the value if it meets
 * the maximum requirement, or an error otherwise.
 *
 * @public
 */
const max = (maxValue: number) =>
  rule((value: number) => (value <= maxValue ? ok(value) : err(TooLarge)));

export { max };
