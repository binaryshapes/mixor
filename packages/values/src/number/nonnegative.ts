import { err, ok, rule } from '@mixor/core';

import type { NumberValueError } from './number';

/**
 * Result error type related to the number `nonnegative` rule.
 *
 * @internal
 */
type Negative = NumberValueError<'NegativeError', 'nonnegative'>;

/**
 * Instance of the `Negative` error type.
 *
 * @internal
 */
const Negative: Negative = {
  code: 'NegativeError',
  context: 'NumberValue',
  origin: 'nonnegative',
  message: 'Number is negative',
};

/**
 * Creates a rule function that checks whether a number is non-negative (≥ 0).
 *
 * @remarks
 * A non-negative number is any number that is greater than or equal to zero.
 * This rule accepts 0 and positive numbers, rejecting negative numbers.
 *
 * @returns A rule function that returns a Result containing the value if it is
 * non-negative, or an error otherwise.
 *
 * @public
 */
const nonnegative = () => rule((value: number) => (value >= 0 ? ok(value) : err(Negative)));

export { nonnegative };
