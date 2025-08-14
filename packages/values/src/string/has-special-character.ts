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
 * Value rule that validates that the value at least contains one special character.
 *
 * @param n - Minimum number of special characters to check for.
 * @returns A result indicating whether the value contains at least one special character.
 *
 * @public
 */
const hasSpecialCharacter = (n = 1) =>
  rule((value: string) => {
    const special = value.match(specialCharacterRegex);
    return special?.length && special.length >= n ? ok(value) : err(NotSpecialCharacter);
  });

export { hasSpecialCharacter };
