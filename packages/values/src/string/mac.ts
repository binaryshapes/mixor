import { err, ok, rule } from '@mixor/core';

import type { StringValueError } from './string';

/**
 * Result error type related to the string `mac` rule.
 *
 * @internal
 */
type InvalidMAC = StringValueError<'InvalidMACError', 'mac'>;

/**
 * Instance of the `InvalidMAC` error type.
 *
 * @internal
 */
const InvalidMAC: InvalidMAC = {
  code: 'InvalidMACError',
  context: 'StringValue',
  origin: 'mac',
  message: 'Value is not a valid MAC address',
};

// Regular expression for MAC address validation.
const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}$/;

/**
 * Creates a rule function that checks whether a string is a valid MAC address.
 *
 * @remarks
 * A valid MAC address follows the format xx:xx:xx:xx:xx:xx or xx-xx-xx-xx-xx-xx
 * where each x is a hexadecimal digit. This rule supports both colon and hyphen
 * separators.
 *
 * @returns A rule function that returns a Result containing the value if it is a valid
 * MAC address, or an error otherwise.
 *
 * @public
 */
const mac = () => rule((value: string) => (macRegex.test(value) ? ok(value) : err(InvalidMAC)));

export { mac };
