import { err, ok, rule } from '@mixor/core';

import type { StringValueError } from './string';

/**
 * Result error type related to the string `alpha` rule.
 *
 * @internal
 */
type NotAlpha = StringValueError<'NotAlphaError', 'alpha'>;

/**
 * Instance of the `NotAlpha` error type.
 *
 * @internal
 */
const NotAlpha: NotAlpha = {
  code: 'NotAlphaError',
  context: 'StringValue',
  origin: 'alpha',
  message: 'Value contains only alphabetic characters',
};

// Regular expression for alphabetic validation (from Zod source code).
const alphaRegex = /^[a-zA-Z]+$/;

/**
 * Creates a value rule function that validates string values contain only alphabetic characters.
 *
 * @remarks
 * An alphabetic string is a string that contains only letters (a-z, A-Z).
 * It rejects numbers, spaces, symbols, and special characters.
 *
 * @returns A rule function that validates that the value contains only alphabetic characters.
 * This function returns a Result type with the value if it contains only letters, or an
 * error if it contains other characters.
 *
 * @public
 */
const alpha = () => rule((value: string) => (alphaRegex.test(value) ? ok(value) : err(NotAlpha)));

export { alpha };
