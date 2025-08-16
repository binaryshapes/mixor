import { err, ok, rule } from '@mixor/core';

import type { StringValueError } from './string';

/**
 * Result error type related to the string `cuid` rule.
 *
 * @internal
 */
type InvalidCUID = StringValueError<'InvalidCUIDError', 'cuid'>;

/**
 * Instance of the `InvalidCUID` error type.
 *
 * @internal
 */
const InvalidCUID: InvalidCUID = {
  code: 'InvalidCUIDError',
  context: 'StringValue',
  origin: 'cuid',
  message: 'Value is not a valid CUID',
};

// Regular expression for CUID validation (from Zod source code).
const cuidRegex = /^[cC][^\s-]{8,}$/;

/**
 * Creates a rule function that checks whether a string is a valid CUID.
 *
 * @remarks
 * A valid CUID (Collision-resistant Unique IDentifier) is a string that starts with
 * either 'c' or 'C', followed by at least 8 characters that are not whitespace or
 * hyphens. This format is designed to be collision-resistant and URL-safe.
 *
 * @returns A rule function that returns a Result containing the value if it is a valid
 * CUID, or an error otherwise.
 *
 * @public
 */
const cuid = () => rule((value: string) => (cuidRegex.test(value) ? ok(value) : err(InvalidCUID)));

export { cuid };
