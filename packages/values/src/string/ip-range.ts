/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { rule } from '@nuxo/components';
import { n } from '@nuxo/core';

// Regular expression for IP range validation.
const ipRangeRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,3}$/;

/**
 * Invalid IP range failure.
 *
 * @internal
 */
class InvalidIpRange extends n.failure(
  'String.InvalidIpRange',
  {
    'en-US': 'The string must be a valid IP range.',
    'es-ES': 'El texto debe ser un rango IP válido.',
  },
) {}

// Apply metadata to the InvalidIpRange failure.
n.info(InvalidIpRange)
  .doc({
    title: 'InvalidIpRange Failure',
    body: n.doc`
    A failure that is returned when the string is not a valid IP range.
    `,
  });

/**
 * A rule that checks if the string is a valid IP range.
 *
 * @remarks
 * A valid IP range follows the format x.x.x.x/y where x.x.x.x is an IPv4 address
 * and y is a subnet mask (0-32). This rule validates the CIDR notation format.
 * If the string is not a valid IP range, the rule will return an error Result with
 * code 'String.InvalidIpRange'.
 *
 * @public
 */
const IpRange = rule(() =>
  n.assert((value: string) => ipRangeRegex.test(value), new InvalidIpRange())
);

n.info(IpRange)
  .type('string')
  .doc({
    title: 'IpRange',
    body: n.doc`
    A rule that checks if the string is a valid IP range. A valid IP range follows the
    format x.x.x.x/y where x.x.x.x is an IPv4 address and y is a subnet mask (0-32).
    This rule validates the CIDR notation format. If the string is not a valid IP range,
    the rule will return a failure Result with code 'String.InvalidIpRange'.
    `,
  });

export { InvalidIpRange, IpRange };
