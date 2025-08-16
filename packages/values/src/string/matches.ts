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
 * Creates a rule function that checks whether a string matches a regular expression pattern.
 *
 * @remarks
 * A string is considered valid if it matches the given regular expression pattern.
 * For example, `matches(/^[a-z]+$/)` will accept strings that contain only
 * lowercase letters.
 *
 * @param pattern - The regular expression to match.
 * @returns A rule function that returns a Result containing the value if it matches
 * the pattern, or an error otherwise.
 *
 * @public
 */
const matches = (pattern: RegExp) =>
  rule((value: string) => (pattern.test(value) ? ok(value) : err(StringNotMatch)));

export { matches };
