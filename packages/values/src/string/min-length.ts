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
 * Value rule that validates that the value has a minimum length.
 *
 * @param minLength - The minimum length of the value.
 * @returns A result indicating whether the value has a minimum length.
 *
 * @public
 */
const minLength = (minLength: number) =>
  rule((value: string) => (value.length >= minLength ? ok(value) : err(TooShort)));

export { minLength };
