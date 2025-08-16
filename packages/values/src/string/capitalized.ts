import { err, ok, rule } from '@mixor/core';

import type { StringValueError } from './string';

/**
 * Result error type related to the string `capitalized` rule.
 *
 * @internal
 */
type NotCapitalized = StringValueError<'NotCapitalizedError', 'capitalized'>;

/**
 * Instance of the `NotCapitalized` error type.
 *
 * @internal
 */
const NotCapitalized: NotCapitalized = {
  code: 'NotCapitalizedError',
  context: 'StringValue',
  origin: 'capitalized',
  message: 'Value is not properly capitalized',
};

// Regular expression for capitalized validation (from Zod source code).
const capitalizedRegex = /^[A-Z][a-z]*$/;

/**
 * Creates a rule function that checks whether a string is properly capitalized.
 *
 * @remarks
 * A capitalized string has the first letter uppercase (A-Z) and the rest lowercase (a-z).
 * Strings that are all lowercase, all uppercase, or have multiple words are rejected.
 *
 * @returns A rule function that returns a Result containing the value if it is properly
 * capitalized, or an error otherwise.
 *
 * @public
 */
const capitalized = () =>
  rule((value: string) => (capitalizedRegex.test(value) ? ok(value) : err(NotCapitalized)));

export { capitalized };
