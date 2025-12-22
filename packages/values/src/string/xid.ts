/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { rule } from '@nuxo/components';
import { n } from '@nuxo/core';

// Regular expression for XID validation (from Zod source code).
const xidRegex = /^[0-9a-vA-V]{20}$/;

/**
 * Invalid XID failure.
 *
 * @internal
 */
class InvalidXid extends n.failure(
  'String.InvalidXid',
  {
    'en-US': 'The string must be a valid XID.',
    'es-ES': 'El texto debe ser un XID válido.',
  },
) {}

// Apply metadata to the InvalidXid failure.
n.info(InvalidXid)
  .doc({
    title: 'InvalidXid Failure',
    body: n.doc`
    A failure that is returned when the string is not a valid XID.
    `,
  });

/**
 * A rule that checks if the string is a valid XID.
 *
 * @remarks
 * A valid XID (eXtended IDentifier) is a string that contains exactly 20 characters
 * from the set: numbers (0-9) and letters (a-v, A-V). This format is designed to be
 * URL-safe and provides a good balance between uniqueness and readability.
 * If the string is not a valid XID, the rule will return an error Result with
 * code 'String.InvalidXid'.
 *
 * @public
 */
const Xid = rule(() => n.assert((value: string) => xidRegex.test(value), new InvalidXid()));

n.info(Xid)
  .type('string')
  .doc({
    title: 'Xid',
    body: n.doc`
    A rule that checks if the string is a valid XID (eXtended IDentifier). A valid XID is a
    string that contains exactly 20 characters from the set: numbers (0-9) and letters (a-v, A-V).
    This format is designed to be URL-safe and provides a good balance between uniqueness and
    readability. If the string is not a valid XID, the rule will return a failure Result with
    code 'String.InvalidXid'.
    `,
  });

export { InvalidXid, Xid };
