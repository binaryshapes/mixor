import { err, ok, rule } from '@mixor/core';

import type { StringValueError } from './string';

/**
 * Result error type related to the string `uuid` rule.
 *
 * @internal
 */
type InvalidUUID = StringValueError<'InvalidUUIDError', 'uuid'>;

/**
 * Instance of the `InvalidUUID` error type.
 *
 * @internal
 */
const InvalidUUID: InvalidUUID = {
  code: 'InvalidUUIDError',
  context: 'StringValue',
  origin: 'uuid',
  message: 'Value is not a valid UUID',
};

/**
 * Regular expression for UUID validation with optional version specification.
 *
 * @remarks
 * If version is not provided, all versions are supported.
 * If version is provided, only that specific version is accepted.
 *
 * @param version - The UUID version to validate (1-8, or undefined for any version).
 * @returns A regular expression for the specified UUID version.
 *
 * @internal
 */
const uuidRegex = (version?: number): RegExp => {
  if (!version) {
    // All versions + null UUID
    return /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000)$/;
  }

  // Specific version
  return new RegExp(
    `^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${version}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`,
  );
};

/**
 * Creates a rule function that checks whether a string is a valid UUID.
 *
 * @remarks
 * A valid UUID follows the format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 * where x are hexadecimal characters. If a version is specified, only
 * that version is accepted. If no version is specified, any valid UUID
 * version is accepted.
 *
 * @param version - The UUID version to validate (1-8, or undefined for any version).
 * @returns A rule function that returns a Result containing the value if it is a valid
 * UUID, or an error otherwise.
 *
 * @public
 */
const uuid = (version?: number) =>
  rule((value: string) => {
    const pattern = uuidRegex(version);
    return pattern.test(value) ? ok(value) : err(InvalidUUID);
  });

export { uuid };
