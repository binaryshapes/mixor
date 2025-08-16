import { err, ok, rule } from '@mixor/core';

import type { NumberValueError } from './number';

/**
 * Result error type related to the number `int` rule.
 *
 * @internal
 */
type NotInteger = NumberValueError<'NotIntegerError', 'int'>;

/**
 * Instance of the `NotInteger` error type.
 *
 * @internal
 */
const NotInteger: NotInteger = {
  code: 'NotIntegerError',
  context: 'NumberValue',
  origin: 'int',
  message: 'Number is not an integer',
};

/**
 * Creates a rule function that checks whether a number is an integer.
 *
 * @remarks
 * An integer is any number that has no fractional part (no decimal places).
 * This rule accepts whole numbers like 1, 2, -3, 0, etc., rejecting
 * decimal numbers like 1.5, 2.7, etc.
 *
 * @returns A rule function that returns a Result containing the value if it is
 * an integer, or an error otherwise.
 *
 * @public
 */
const int = () => rule((value: number) => (Number.isInteger(value) ? ok(value) : err(NotInteger)));

export { int };
