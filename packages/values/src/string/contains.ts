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
 * Creates a value rule function that validates string values are contained in a list.
 *
 * @remarks
 * A string is considered okay if it is contained in the given list. i.e.
 * `contains(['hello', 'world'])` will return true if the string is 'hello' or 'world'.
 *
 * @param list - The list of values to check.
 * @returns A rule function that validates that the value is contained in the given list.
 * This function returns a Result type with the value if it is contained in the given list, or an
 * error if it is not.
 *
 * @public
 */
const contains = (list: string[]) =>
  rule((value: string) => (list.includes(value) ? ok(value) : err(NotContain)));

export { contains };
