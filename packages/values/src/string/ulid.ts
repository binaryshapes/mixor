import { err, ok, rule } from '@mixor/core';

import type { StringValueError } from './string';

/**
 * Result error type related to the string `ulid` rule.
 *
 * @internal
 */
type InvalidULID = StringValueError<'InvalidULIDError', 'ulid'>;

/**
 * Instance of the `InvalidULID` error type.
 *
 * @internal
 */
const InvalidULID: InvalidULID = {
  code: 'InvalidULIDError',
  context: 'StringValue',
  origin: 'ulid',
  message: 'Value is not a valid ULID',
};

// Regular expression for ULID validation (from Zod source code).
const ulidRegex = /^[0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{26}$/;

/**
 * Creates a rule function that checks whether a string is a valid ULID.
 *
 * @remarks
 * A valid ULID (Universally Unique Lexicographically Sortable Identifier) is a string
 * that contains exactly 26 characters from the set: numbers (0-9), uppercase letters
 * (A-Z, excluding I, O, U), and lowercase letters (a-z, excluding i, o, u). This
 * format is designed to be URL-safe and sortable by timestamp.
 *
 * @returns A rule function that returns a Result containing the value if it is a valid
 * ULID, or an error otherwise.
 *
 * @public
 */
const ulid = () => rule((value: string) => (ulidRegex.test(value) ? ok(value) : err(InvalidULID)));

export { ulid };
