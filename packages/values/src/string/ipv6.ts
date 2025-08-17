import { err, ok, rule } from '@mixor/core';

import type { StringValueError } from './string';

/**
 * Result error type related to the string `ipv6` rule.
 *
 * @internal
 */
type InvalidIPv6 = StringValueError<'InvalidIPv6Error', 'ipv6'>;

/**
 * Instance of the `InvalidIPv6` error type.
 *
 * @internal
 */
const InvalidIPv6: InvalidIPv6 = {
  code: 'InvalidIPv6Error',
  context: 'StringValue',
  origin: 'ipv6',
  message: 'Value is not a valid IPv6 address',
};

// Regular expression for IPv6 validation.
const ipv6Regex =
  /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::|([0-9a-fA-F]{1,4})?::([0-9a-fA-F]{1,4}:?){0,6})$/;

/**
 * Creates a rule function that checks whether a string is a valid IPv6 address.
 *
 * @remarks
 * A valid IPv6 address follows the format xxxx:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx
 * where each x is a hexadecimal digit. This rule supports compressed notation with
 * double colons (::) and validates the format.
 *
 * @returns A rule function that returns a Result containing the value if it is a valid
 * IPv6 address, or an error otherwise.
 *
 * @public
 */
const ipv6 = () => rule((value: string) => (ipv6Regex.test(value) ? ok(value) : err(InvalidIPv6)));

export { ipv6 };
