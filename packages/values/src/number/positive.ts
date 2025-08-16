import { err, ok, rule } from '@mixor/core';

import type { NumberValueError } from './number';

/**
 * Result error type related to the number `positive` rule.
 *
 * @internal
 */
type NotPositive = NumberValueError<'NotPositiveError', 'positive'>;

/**
 * Instance of the `NotPositive` error type.
 *
 * @internal
 */
const NotPositive: NotPositive = {
  code: 'NotPositiveError',
  context: 'NumberValue',
  origin: 'positive',
  message: 'Number is not positive',
};

/**
 * Creates a rule function that checks whether a number is positive (greater than 0).
 *
 * @remarks
 * A positive number is any number that is greater than zero.
 * This rule accepts only positive numbers, rejecting 0 and negative numbers.
 *
 * @returns A rule function that returns a Result containing the value if it is
 * positive, or an error otherwise.
 *
 * @public
 */
const positive = () => rule((value: number) => (value > 0 ? ok(value) : err(NotPositive)));

export { positive };
