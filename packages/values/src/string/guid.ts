import { err, ok, rule } from '@mixor/core';

import type { StringValueError } from './string';

/**
 * Result error type related to the string `guid` rule.
 *
 * @internal
 */
type InvalidGUID = StringValueError<'InvalidGUIDError', 'guid'>;

/**
 * Instance of the `InvalidGUID` error type.
 *
 * @internal
 */
const InvalidGUID: InvalidGUID = {
  code: 'InvalidGUIDError',
  context: 'StringValue',
  origin: 'guid',
  message: 'Value is not a valid GUID',
};

// Regular expression for GUID validation (from Zod source code).
const guidRegex = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/;

/**
 * Creates a rule function that checks whether a string is a valid GUID.
 *
 * @remarks
 * A valid GUID (Globally Unique Identifier) is a string that follows the format:
 * xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx where x are hexadecimal characters.
 * This format is identical to UUID and is commonly used in Microsoft systems.
 *
 * @returns A rule function that returns a Result containing the value if it is a valid
 * GUID, or an error otherwise.
 *
 * @public
 */
const guid = () => rule((value: string) => (guidRegex.test(value) ? ok(value) : err(InvalidGUID)));

export { guid };
