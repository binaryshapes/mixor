import { err, ok, rule } from '@mixor/core';

import type { NumberValueError } from './number';

/**
 * Result error type related to the number `negative` rule.
 *
 * @internal
 */
type NotNegative = NumberValueError<'NotNegativeError', 'negative'>;

/**
 * Instance of the `NotNegative` error type.
 *
 * @internal
 */
const NotNegative: NotNegative = {
  code: 'NotNegativeError',
  context: 'NumberValue',
  origin: 'negative',
  message: 'Number is not negative',
};

/**
 * Creates a rule function that checks whether a number is negative (less than 0).
 *
 * @remarks
 * A negative number is any number that is less than zero.
 * This rule accepts only negative numbers, rejecting 0 and positive numbers.
 *
 * @returns A rule function that returns a Result containing the value if it is
 * negative, or an error otherwise.
 *
 * @public
 */
const negative = () => rule((value: number) => (value < 0 ? ok(value) : err(NotNegative)));

export { negative };
