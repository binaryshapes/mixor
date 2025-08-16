import { err, ok, rule } from '@mixor/core';

import type { StringValueError } from './string';

/**
 * Result error type related to the string `nanoid` rule.
 *
 * @internal
 */
type InvalidNanoID = StringValueError<'InvalidNanoIDError', 'nanoid'>;

/**
 * Instance of the `InvalidNanoID` error type.
 *
 * @internal
 */
const InvalidNanoID: InvalidNanoID = {
  code: 'InvalidNanoIDError',
  context: 'StringValue',
  origin: 'nanoid',
  message: 'Value is not a valid NanoID',
};

// Regular expression for NanoID validation (from Zod source code).
const nanoidRegex = /^[a-zA-Z0-9_-]{21}$/;

/**
 * Creates a rule function that checks whether a string is a valid NanoID.
 *
 * @remarks
 * A valid NanoID is a string that contains exactly 21 characters from the set:
 * lowercase letters (a-z), uppercase letters (A-Z), numbers (0-9), underscores (_),
 * and hyphens (-). This format is commonly used for generating URL-safe unique
 * identifiers.
 *
 * @returns A rule function that returns a Result containing the value if it is a valid
 * NanoID, or an error otherwise.
 *
 * @public
 */
const nanoid = () =>
  rule((value: string) => (nanoidRegex.test(value) ? ok(value) : err(InvalidNanoID)));

export { nanoid };
