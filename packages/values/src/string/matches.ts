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
 * Value rule that validates that the value matches a regular expression pattern.
 *
 * @param pattern - The regular expression to match.
 * @returns A result indicating whether the value matches the regular expression.
 *
 * @public
 */
const matches = (pattern: RegExp) =>
  rule((value: string) => (pattern.test(value) ? ok(value) : err(StringNotMatch)));

export { matches };
