import { err, ok, rule } from '@mixor/core';

import type { StringValueError } from './string';

/**
 * Result error type related to the string `minLength` rule.
 *
 * @internal
 */
type TooShort = StringValueError<'TooShortError', 'minLength'>;

/**
 * Instance of the `TooShort` error type.
 *
 * @internal
 */
const TooShort: TooShort = {
  code: 'TooShortError',
  context: 'StringValue',
  origin: 'minLength',
  message: 'String length is less than minimum',
};

/**
 * Creates a value rule function that validates string values have a minimum length.
 *
 * @remarks
 * A string is considered too short if it has fewer characters than the minimum length.
 *
 * @param minLength - The minimum length of the value.
 * @returns A rule function that validates that the value has a minimum length.
 * This function returns a Result type with the value if it has a minimum length, or an
 * error if it does not.
 *
 * @public
 */
const minLength = (minLength: number) =>
  rule((value: string) => (value.length >= minLength ? ok(value) : err(TooShort)));

export { minLength };
