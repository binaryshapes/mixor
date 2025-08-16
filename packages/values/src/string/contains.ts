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
 * Creates a rule function that checks whether a string is contained in a list.
 *
 * @remarks
 * A string is considered valid if it is contained in the given list. For example,
 * `contains(['hello', 'world'])` will accept strings that are 'hello' or 'world'.
 *
 * @param list - The list of values to check against.
 * @returns A rule function that returns a Result containing the value if it is in the
 * list, or an error otherwise.
 *
 * @public
 */
const contains = (list: string[]) =>
  rule((value: string) => (list.includes(value) ? ok(value) : err(NotContain)));

export { contains };
