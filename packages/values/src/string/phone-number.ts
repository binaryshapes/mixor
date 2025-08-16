import { err, ok, rule } from '@mixor/core';

import type { StringValueError } from './string';

/**
 * Result error type related to the string `phoneNumber` rule.
 *
 * @internal
 */
type InvalidPhoneNumber = StringValueError<'InvalidPhoneNumberError', 'phoneNumber'>;

/**
 * Instance of the `InvalidPhoneNumber` error type.
 *
 * @internal
 */
const InvalidPhoneNumber: InvalidPhoneNumber = {
  code: 'InvalidPhoneNumberError',
  context: 'StringValue',
  origin: 'phoneNumber',
  message: 'Value is not a valid phone number',
};

// Regular expression for phone number validation (from Zod source code).
// https://blog.stevenlevithan.com/archives/validate-phone-number#r4-3 (regex sans spaces)
const phoneNumberRegex = /^\+(?:[0-9]){6,14}[0-9]$/;

/**
 * Creates a rule function that checks whether a string is a valid phone number.
 *
 * @remarks
 * A valid phone number starts with a plus sign (+) followed by 7-15 digits.
 * It rejects invalid phone number formats and non-phone strings.
 *
 * @returns A rule function that returns a Result containing the value if it is a valid
 * phone number, or an error otherwise.
 *
 * @public
 */
const phoneNumber = () =>
  rule((value: string) => (phoneNumberRegex.test(value) ? ok(value) : err(InvalidPhoneNumber)));

export { phoneNumber };
