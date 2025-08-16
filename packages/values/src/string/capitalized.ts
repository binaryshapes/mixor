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
 * Creates a value rule function that validates string values are properly capitalized.
 *
 * @remarks
 * A capitalized string is a string where the first letter is uppercase (A-Z) and the rest
 * are lowercase (a-z). It rejects strings that are all lowercase, all uppercase, or
 * have multiple words.
 *
 * @returns A rule function that validates that the value is properly capitalized.
 * This function returns a Result type with the value if it is properly capitalized, or an
 * error if it is not.
 *
 * @public
 */
const capitalized = () =>
  rule((value: string) => (capitalizedRegex.test(value) ? ok(value) : err(NotCapitalized)));

export { capitalized };
