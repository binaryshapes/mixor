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
 * A rule that checks if the string is a valid IPv4 address.
 *
 * @remarks
 * A valid IPv4 address follows the format x.x.x.x where each x is a number between
 * 0 and 255. This rule validates the format and ensures each octet is within the
 * valid range. If the string is not a valid IPv4 address, the rule will return an
 * error Result with code 'INVALID_IPV4'.
 *
 * @public
 */
const Ipv4 = rule(() => n.assert((value: string) => ipv4Regex.test(value), 'INVALID_IPV4'));

n.info(Ipv4)
  .type('string')
  .doc({
    title: 'Ipv4',
    body: n.doc`
    A rule that checks if the string is a valid IPv4 address. A valid IPv4 address follows
    the format x.x.x.x where each x is a number between 0 and 255. This rule validates the
    format and ensures each octet is within the valid range. If the string is not a valid
    IPv4 address, the rule will return a failure Result with code 'INVALID_IPV4'.
    `,
  });

export { Ipv4 };
