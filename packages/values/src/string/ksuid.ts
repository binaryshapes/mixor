import { err, ok, rule } from '@mixor/core';

import type { StringValueError } from './string';

/**
 * Result error type related to the string `ksuid` rule.
 *
 * @internal
 */
type InvalidKSUID = StringValueError<'InvalidKSUIDError', 'ksuid'>;

/**
 * Instance of the `InvalidKSUID` error type.
 *
 * @internal
 */
const InvalidKSUID: InvalidKSUID = {
  code: 'InvalidKSUIDError',
  context: 'StringValue',
  origin: 'ksuid',
  message: 'Value is not a valid KSUID',
};

// Regular expression for KSUID validation (from Zod source code).
const ksuidRegex = /^[A-Za-z0-9]{27}$/;

/**
 * Creates a rule function that checks whether a string is a valid KSUID.
 *
 * @remarks
 * A valid KSUID (K-Sortable Unique IDentifier) is a string that contains exactly
 * 27 characters from the set: numbers (0-9), uppercase letters (A-Z), and lowercase
 * letters (a-z). This format is designed to be URL-safe and sortable by timestamp.
 *
 * @returns A rule function that returns a Result containing the value if it is a valid
 * KSUID, or an error otherwise.
 *
 * @public
 */
const ksuid = () =>
  rule((value: string) => (ksuidRegex.test(value) ? ok(value) : err(InvalidKSUID)));

export { ksuid };
