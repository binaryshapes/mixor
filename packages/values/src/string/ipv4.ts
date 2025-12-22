/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { rule } from '@nuxo/components';
import { n } from '@nuxo/core';

// Regular expression for IPv4 validation.
const ipv4Regex =
  /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;

/**
 * Invalid IPv4 failure.
 *
 * @internal
 */
class InvalidIpv4 extends n.failure(
  'String.InvalidIpv4',
  {
    'en-US': 'The string must be a valid IPv4 address.',
    'es-ES': 'El texto debe ser una dirección IPv4 válida.',
  },
) {}

// Apply metadata to the InvalidIpv4 failure.
n.info(InvalidIpv4)
  .doc({
    title: 'InvalidIpv4 Failure',
    body: n.doc`
    A failure that is returned when the string is not a valid IPv4 address.
    `,
  });

/**
 * A rule that checks if the string is a valid IPv4 address.
 *
 * @remarks
 * A valid IPv4 address follows the format x.x.x.x where each x is a number between
 * 0 and 255. This rule validates the format and ensures each octet is within the
 * valid range. If the string is not a valid IPv4 address, the rule will return an
 * error Result with code 'String.InvalidIpv4'.
 *
 * @public
 */
const Ipv4 = rule(() => n.assert((value: string) => ipv4Regex.test(value), new InvalidIpv4()));

n.info(Ipv4)
  .type('string')
  .doc({
    title: 'Ipv4',
    body: n.doc`
    A rule that checks if the string is a valid IPv4 address. A valid IPv4 address follows
    the format x.x.x.x where each x is a number between 0 and 255. This rule validates the
    format and ensures each octet is within the valid range. If the string is not a valid
    IPv4 address, the rule will return a failure Result with code 'String.InvalidIpv4'.
    `,
  });

export { Ipv4, InvalidIpv4 };
