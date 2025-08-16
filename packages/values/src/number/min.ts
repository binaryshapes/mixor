import { err, ok, rule } from '@mixor/core';

import type { NumberValueError } from './number';

/**
 * Result error type related to the number `min` rule.
 *
 * @internal
 */
type TooSmall = NumberValueError<'TooSmallError', 'min'>;

/**
 * Instance of the `TooSmall` error type.
 *
 * @internal
 */
const TooSmall: TooSmall = {
  code: 'TooSmallError',
  context: 'NumberValue',
  origin: 'min',
  message: 'Number is less than minimum value',
};

/**
 * Creates a rule function that checks whether a number is greater than or equal to a minimum value.
 *
 * @remarks
 * A number is considered valid if it is greater than or equal to the specified minimum value.
 * For example, `min(5)` will accept numbers like 5, 6, 7, etc.
 *
 * @param minValue - The minimum value that the number must be greater than or equal to.
 * @returns A rule function that returns a Result containing the value if it meets
 * the minimum requirement, or an error otherwise.
 *
 * @public
 */
const min = (minValue: number) =>
  rule((value: number) => (value >= minValue ? ok(value) : err(TooSmall)));

export { min };
