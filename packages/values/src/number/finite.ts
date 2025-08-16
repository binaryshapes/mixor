import { err, ok, rule } from '@mixor/core';

import type { NumberValueError } from './number';

/**
 * Result error type related to the number `finite` rule.
 *
 * @internal
 */
type NotFinite = NumberValueError<'NotFiniteError', 'finite'>;

/**
 * Instance of the `NotFinite` error type.
 *
 * @internal
 */
const NotFinite: NotFinite = {
  code: 'NotFiniteError',
  context: 'NumberValue',
  origin: 'finite',
  message: 'Number is not finite',
};

/**
 * Creates a rule function that checks whether a number is finite.
 *
 * @remarks
 * A finite number is any number that is not Infinity, -Infinity, or NaN.
 * This rule rejects infinite values and NaN, accepting only regular numbers.
 *
 * @returns A rule function that returns a Result containing the value if it is finite,
 * or an error otherwise.
 *
 * @public
 */
const finite = () => rule((value: number) => (Number.isFinite(value) ? ok(value) : err(NotFinite)));

export { finite };
