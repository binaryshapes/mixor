import { err, ok, rule } from '@mixor/core';

import type { NumberValueError } from './number';

/**
 * Result error type related to the number `precision` rule.
 *
 * @internal
 */
type TooManyDecimals = NumberValueError<'TooManyDecimalsError', 'precision'>;

/**
 * Instance of the `TooManyDecimals` error type.
 *
 * @internal
 */
const TooManyDecimals: TooManyDecimals = {
  code: 'TooManyDecimalsError',
  context: 'NumberValue',
  origin: 'precision',
  message: 'Number has too many decimal places',
};

/**
 * Creates a rule function that checks whether a number has a limited number of decimal places.
 *
 * @remarks
 * This rule validates that a number has no more than the specified number of decimal places.
 * For example, `precision(2)` will accept numbers like 1.23, 45.6, 7, etc., but reject
 * numbers like 1.234, 45.678, etc.
 *
 * @param maxDecimals - The maximum number of decimal places allowed.
 * @returns A rule function that returns a Result containing the value if it has
 * the required precision, or an error otherwise.
 *
 * @public
 */
const precision = (maxDecimals: number) =>
  rule((value: number) => {
    const decimalPlaces = (value.toString().split('.')[1] || '').length;
    return decimalPlaces <= maxDecimals ? ok(value) : err(TooManyDecimals);
  });

export { precision };
