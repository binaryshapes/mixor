import { err, ok, rule } from '@mixor/core';

import type { StringValueError } from './string';

/**
 * Result error type related to the string `matches` rule.
 *
 * @internal
 */
type StringNotMatch = StringValueError<'StringNotMatchError', 'matches'>;

/**
 * Instance of the `StringNotMatch` error type.
 *
 * @internal
 */
const StringNotMatch: StringNotMatch = {
  code: 'StringNotMatchError',
  context: 'StringValue',
  origin: 'matches',
  message: 'String value does not match with regular expression pattern',
};

/**
 * Creates a value rule function that validates string values match a regular expression pattern.
 *
 * @remarks
 * A string is considered okay if it matches the given regular expression pattern. i.e.
 * `matches(/^[a-z]+$/)` will return true if the string contains only lowercase letters.
 *
 * @param pattern - The regular expression to match.
 * @returns A rule function that validates that the value matches the given regular expression
 * pattern. This function returns a Result type with the value if it matches the given regular
 * expression pattern, or an error if it does not.
 *
 * @public
 */
const matches = (pattern: RegExp) =>
  rule((value: string) => (pattern.test(value) ? ok(value) : err(StringNotMatch)));

export { matches };
