import { err, ok, rule } from '@mixor/core';

import type { StringValueError } from './string';

/**
 * Result error type related to the string `ipv4` rule.
 *
 * @internal
 */
type InvalidIPv4 = StringValueError<'InvalidIPv4Error', 'ipv4'>;

/**
 * Instance of the `InvalidIPv4` error type.
 *
 * @internal
 */
const InvalidIPv4: InvalidIPv4 = {
  code: 'InvalidIPv4Error',
  context: 'StringValue',
  origin: 'ipv4',
  message: 'Value is not a valid IPv4 address',
};

// Regular expression for IPv4 validation.
const ipv4Regex =
  /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;

/**
 * Creates a rule function that checks whether a string is a valid IPv4 address.
 *
 * @remarks
 * A valid IPv4 address follows the format x.x.x.x where each x is a number between
 * 0 and 255. This rule validates the format and ensures each octet is within the
 * valid range.
 *
 * @returns A rule function that returns a Result containing the value if it is a valid
 * IPv4 address, or an error otherwise.
 *
 * @public
 */
const ipv4 = () => rule((value: string) => (ipv4Regex.test(value) ? ok(value) : err(InvalidIPv4)));

export { ipv4 };
