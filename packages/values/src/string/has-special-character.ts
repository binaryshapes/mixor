import { err, ok, rule } from '@mixor/core';

import type { StringValueError } from './string';

/**
 * Result error type related to the string `hasSpecialCharacter` rule.
 *
 * @internal
 */
type NotSpecialCharacter = StringValueError<'NotSpecialCharacterError', 'hasSpecialCharacter'>;

/**
 * Instance of the `NotSpecialCharacter` error type.
 *
 * @internal
 */
const NotSpecialCharacter: NotSpecialCharacter = {
  code: 'NotSpecialCharacterError',
  context: 'StringValue',
  origin: 'hasSpecialCharacter',
  message: 'Value does not contain required special characters',
};

// Regular expression for special character validation (from Zod source code).
const specialCharacterRegex = /[!@#$%^&*()_+\-=\\[\]{};':"\\|,.<>\\/?]/;

/**
 * Creates a rule function that checks whether a string contains at least one special character.
 *
 * @remarks
 * A string is considered valid if it contains the given number of special characters. For
 * example, `hasSpecialCharacter(2)` will accept strings that contain at least two
 * special characters.
 *
 * @param n - Minimum number of special characters to check for.
 * @returns A rule function that returns a Result containing the value if it contains
 * the required number of special characters, or an error otherwise.
 *
 * @public
 */
const hasSpecialCharacter = (n = 1) =>
  rule((value: string) => {
    const special = value.match(specialCharacterRegex);
    return special?.length && special.length >= n ? ok(value) : err(NotSpecialCharacter);
  });

export { hasSpecialCharacter };
