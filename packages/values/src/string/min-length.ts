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
 * Creates a rule function that checks whether a string has a minimum length.
 *
 * @remarks
 * A string is considered valid if it has more or equal characters than the minimum length.
 *
 * @param minLength - The minimum length of the value.
 * @returns A rule function that returns a Result containing the value if it meets
 * the length requirement, or an error otherwise.
 *
 * @public
 */
const minLength = (minLength: number) =>
  rule((value: string) => (value.length >= minLength ? ok(value) : err(TooShort)));

export { minLength };
