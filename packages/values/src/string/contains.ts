import { err, ok, rule } from '@mixor/core';

import type { StringValueError } from './string';

/**
 * Result error type related to the string `contains` rule.
 *
 * @internal
 */
type NotContain = StringValueError<'NotContainError', 'contains'>;

/**
 * Instance of the `NotContain` error type.
 *
 * @internal
 */
const NotContain: NotContain = {
  code: 'NotContainError',
  context: 'StringValue',
  origin: 'contains',
  message: 'Value is not contained in the list',
};

/**
 * Value rule that validates that the value contains a value from a list.
 *
 * @param list - The list of values to check.
 * @returns A result indicating whether the value contains a value from the list.
 *
 * @public
 */
const contains = (list: string[]) =>
  rule((value: string) => (list.includes(value) ? ok(value) : err(NotContain)));

export { contains };
