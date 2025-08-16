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
 * Creates a value rule function that validates string values contain at least one special character.
 *
 * @remarks
 * A string is considered okay if it contains the given number of special characters. i.e.
 * `hasSpecialCharacter(2)` will return true if the string contains at least two special characters.
 *
 * @param n - Minimum number of special characters to check for.
 * @returns A rule function that validates that the value contains the given number of special
 * characters. This function returns a Result type with the value if it contains the given number of
 * special characters, or an error if it does not.
 *
 * @public
 */
const hasSpecialCharacter = (n = 1) =>
  rule((value: string) => {
    const special = value.match(specialCharacterRegex);
    return special?.length && special.length >= n ? ok(value) : err(NotSpecialCharacter);
  });

export { hasSpecialCharacter };
