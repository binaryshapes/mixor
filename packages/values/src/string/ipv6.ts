/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { rule } from '@nuxo/components';
import { n } from '@nuxo/core';

// Regular expression for IPv6 validation.
const ipv6Regex =
  /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/;

/**
 * A rule that checks if the string is a valid IPv6 address.
 *
 * @remarks
 * A valid IPv6 address follows the format xxxx:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx
 * where each x is a hexadecimal digit. This rule supports compressed notation with
 * double colons (::) and validates the format. If the string is not a valid IPv6 address,
 * the rule will return an error Result with code 'INVALID_IPV6'.
 *
 * @public
 */
const Ipv6 = rule(() => n.assert((value: string) => ipv6Regex.test(value), 'INVALID_IPV6'));

n.info(Ipv6)
  .type('string')
  .doc({
    title: 'Ipv6',
    body: n.doc`
    A rule that checks if the string is a valid IPv6 address. A valid IPv6 address follows
    the format xxxx:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx where each x is a hexadecimal digit.
    This rule supports compressed notation with double colons (::) and validates the format.
    If the string is not a valid IPv6 address, the rule will return a failure Result with
    code 'INVALID_IPV6'.
    `,
  });

export { Ipv6 };
