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
 * Creates a rule function that checks whether a string contains only alphabetic characters.
 *
 * @remarks
 * An alphabetic string contains only letters (a-z, A-Z). Strings with numbers, spaces,
 * symbols, or special characters are rejected.
 *
 * @returns A rule function that returns a Result containing the value if it contains only
 * letters, or an error otherwise.
 *
 * @public
 */
const alpha = () => rule((value: string) => (alphaRegex.test(value) ? ok(value) : err(NotAlpha)));

export { alpha };
