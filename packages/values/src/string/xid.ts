import { err, ok, rule } from '@mixor/core';

import type { StringValueError } from './string';

/**
 * Result error type related to the string `xid` rule.
 *
 * @internal
 */
type InvalidXID = StringValueError<'InvalidXIDError', 'xid'>;

/**
 * Instance of the `InvalidXID` error type.
 *
 * @internal
 */
const InvalidXID: InvalidXID = {
  code: 'InvalidXIDError',
  context: 'StringValue',
  origin: 'xid',
  message: 'Value is not a valid XID',
};

// Regular expression for XID validation (from Zod source code).
const xidRegex = /^[0-9a-vA-V]{20}$/;

/**
 * Creates a rule function that checks whether a string is a valid XID.
 *
 * @remarks
 * A valid XID (eXtended IDentifier) is a string that contains exactly 20 characters
 * from the set: numbers (0-9) and letters (a-v, A-V). This format is designed to be
 * URL-safe and provides a good balance between uniqueness and readability.
 *
 * @returns A rule function that returns a Result containing the value if it is a valid
 * XID, or an error otherwise.
 *
 * @public
 */
const xid = () => rule((value: string) => (xidRegex.test(value) ? ok(value) : err(InvalidXID)));

export { xid };
