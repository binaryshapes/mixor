import { err, ok, rule } from '@mixor/core';

import type { StringValueError } from './string';

/**
 * Result error type related to the string `ipRange` rule.
 *
 * @internal
 */
type InvalidIPRange = StringValueError<'InvalidIPRangeError', 'ipRange'>;

/**
 * Instance of the `InvalidIPRange` error type.
 *
 * @internal
 */
const InvalidIPRange: InvalidIPRange = {
  code: 'InvalidIPRangeError',
  context: 'StringValue',
  origin: 'ipRange',
  message: 'Value is not a valid IP range',
};

// Regular expression for IP range validation.
const ipRangeRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,3}$/;

/**
 * Creates a rule function that checks whether a string is a valid IP range.
 *
 * @remarks
 * A valid IP range follows the format x.x.x.x/y where x.x.x.x is an IPv4 address
 * and y is a subnet mask (0-32). This rule validates the CIDR notation format.
 *
 * @returns A rule function that returns a Result containing the value if it is a valid
 * IP range, or an error otherwise.
 *
 * @public
 */
const ipRange = () =>
  rule((value: string) => (ipRangeRegex.test(value) ? ok(value) : err(InvalidIPRange)));

export { ipRange };
