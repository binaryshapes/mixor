import { err, ok, rule } from '@mixor/core';

import type { NumberValueError } from './number';

/**
 * Result error type related to the number `multipleOf` rule.
 *
 * @internal
 */
type NotMultipleOf = NumberValueError<'NotMultipleOfError', 'multipleOf'>;

/**
 * Instance of the `NotMultipleOf` error type.
 *
 * @internal
 */
const NotMultipleOf: NotMultipleOf = {
  code: 'NotMultipleOfError',
  context: 'NumberValue',
  origin: 'multipleOf',
  message: 'Number is not a multiple of the specified value',
};

/**
 * Creates a rule function that checks whether a number is a multiple of a specified divisor.
 *
 * @remarks
 * A number is a multiple of the divisor if it can be divided evenly by the divisor
 * (i.e., the remainder is 0). For example, `multipleOf(5)` will accept numbers
 * like 5, 10, 15, 20, etc.
 *
 * @param divisor - The divisor to check multiples against.
 * @returns A rule function that returns a Result containing the value if it is a
 * multiple of the divisor, or an error otherwise.
 *
 * @public
 */
const multipleOf = (divisor: number) =>
  rule((value: number) => (value % divisor === 0 ? ok(value) : err(NotMultipleOf)));

export { multipleOf };
