import { err, ok, rule } from '@mixor/core';

import type { StringValueError } from './string';

/**
 * Result error type related to the string `cuid2` rule.
 *
 * @internal
 */
type InvalidCUID2 = StringValueError<'InvalidCUID2Error', 'cuid2'>;

/**
 * Instance of the `InvalidCUID2` error type.
 *
 * @internal
 */
const InvalidCUID2: InvalidCUID2 = {
  code: 'InvalidCUID2Error',
  context: 'StringValue',
  origin: 'cuid2',
  message: 'Value is not a valid CUID2',
};

// Regular expression for CUID2 validation (from Zod source code).
const cuid2Regex = /^[0-9a-z]+$/;

/**
 * Creates a rule function that checks whether a string is a valid CUID2.
 *
 * @remarks
 * A valid CUID2 (Collision-resistant Unique IDentifier version 2) is a string that
 * contains only lowercase letters (a-z) and numbers (0-9). This format is designed
 * to be collision-resistant, URL-safe, and more compact than the original CUID.
 *
 * @returns A rule function that returns a Result containing the value if it is a valid
 * CUID2, or an error otherwise.
 *
 * @public
 */
const cuid2 = () =>
  rule((value: string) => (cuid2Regex.test(value) ? ok(value) : err(InvalidCUID2)));

export { cuid2 };
