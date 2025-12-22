/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { rule } from '@nuxo/components';
import { n } from '@nuxo/core';

// Regular expression for phone number validation (from Zod source code).
// https://blog.stevenlevithan.com/archives/validate-phone-number#r4-3 (regex sans spaces)
const phoneNumberRegex = /^\+(?:[0-9]){6,14}[0-9]$/;

/**
 * Invalid phone number failure.
 *
 * @internal
 */
class InvalidPhoneNumber extends n.failure(
  'String.InvalidPhoneNumber',
  {
    'en-US': 'The string must be a valid phone number.',
    'es-ES': 'El texto debe ser un número de teléfono válido.',
  },
) {}

// Apply metadata to the InvalidPhoneNumber failure.
n.info(InvalidPhoneNumber)
  .doc({
    title: 'InvalidPhoneNumber Failure',
    body: n.doc`
    A failure that is returned when the string is not a valid phone number.
    `,
  });

/**
 * A rule that checks if the string is a valid phone number.
 *
 * @remarks
 * A valid phone number starts with a plus sign (+) followed by 7-15 digits.
 * It rejects invalid phone number formats and non-phone strings. If the string is not
 * a valid phone number, the rule will return an error Result with code 'String.InvalidPhoneNumber'.
 *
 * @public
 */
const PhoneNumber = rule(() =>
  n.assert((value: string) => phoneNumberRegex.test(value), new InvalidPhoneNumber())
);

n.info(PhoneNumber)
  .type('string')
  .doc({
    title: 'PhoneNumber',
    body: n.doc`
    A rule that checks if the string is a valid phone number. A valid phone number starts
    with a plus sign (+) followed by 7-15 digits. It rejects invalid phone number formats
    and non-phone strings. If the string is not a valid phone number, the rule will return
    a failure Result with code 'String.InvalidPhoneNumber'.
    `,
  });

export { InvalidPhoneNumber, PhoneNumber };
