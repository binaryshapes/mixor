/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { rule } from '@nuxo/components';
import { n } from '@nuxo/core';

// Regular expression for MAC address validation.
const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}$/;

/**
 * Invalid MAC failure.
 *
 * @internal
 */
class InvalidMac extends n.failure(
  'String.InvalidMac',
  {
    'en-US': 'The string must be a valid MAC address.',
    'es-ES': 'El texto debe ser una dirección MAC válida.',
  },
) {}

// Apply metadata to the InvalidMac failure.
n.info(InvalidMac)
  .doc({
    title: 'InvalidMac Failure',
    body: n.doc`
    A failure that is returned when the string is not a valid MAC address.
    `,
  });

/**
 * A rule that checks if the string is a valid MAC address.
 *
 * @remarks
 * A valid MAC address follows the format xx:xx:xx:xx:xx:xx or xx-xx-xx-xx-xx-xx
 * where each x is a hexadecimal digit. This rule supports both colon and hyphen
 * separators. If the string is not a valid MAC address, the rule will return an
 * error Result with code 'String.InvalidMac'.
 *
 * @public
 */
const Mac = rule(() => n.assert((value: string) => macRegex.test(value), new InvalidMac()));

n.info(Mac)
  .type('string')
  .doc({
    title: 'Mac',
    body: n.doc`
    A rule that checks if the string is a valid MAC address. A valid MAC address follows
    the format xx:xx:xx:xx:xx:xx or xx-xx-xx-xx-xx-xx where each x is a hexadecimal digit.
    This rule supports both colon and hyphen separators. If the string is not a valid MAC
    address, the rule will return a failure Result with code 'String.InvalidMac'.
    `,
  });

export { InvalidMac, Mac };
