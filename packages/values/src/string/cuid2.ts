/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { rule } from '@nuxo/components';
import { n } from '@nuxo/core';

// Regular expression for CUID2 validation (from Zod source code).
const cuid2Regex = /^[0-9a-z]+$/;

/**
 * Invalid CUID2 failure.
 *
 * @internal
 */
class InvalidCuid2 extends n.failure(
  'String.InvalidCuid2',
  {
    'en-US': 'The string must be a valid CUID2.',
    'es-ES': 'El texto debe ser un CUID2 válido.',
  },
) {}

// Apply metadata to the InvalidCuid2 failure.
n.info(InvalidCuid2)
  .doc({
    title: 'InvalidCuid2 Failure',
    body: n.doc`
    A failure that is returned when the string is not a valid CUID2.
    `,
  });

/**
 * A rule that checks if the string is a valid CUID2.
 *
 * @remarks
 * A valid CUID2 (Collision-resistant Unique IDentifier version 2) is a string that
 * contains only lowercase letters (a-z) and numbers (0-9). This format is designed
 * to be collision-resistant, URL-safe, and more compact than the original CUID.
 * If the string is not a valid CUID2, the rule will return an error Result with code
 * 'String.InvalidCuid2'.
 *
 * @public
 */
const Cuid2 = rule(() => n.assert((value: string) => cuid2Regex.test(value), new InvalidCuid2()));

n.info(Cuid2)
  .type('string')
  .doc({
    title: 'Cuid2',
    body: n.doc`
    A rule that checks if the string is a valid CUID2 (Collision-resistant Unique IDentifier
    version 2). A valid CUID2 is a string that contains only lowercase letters (a-z) and
    numbers (0-9). This format is designed to be collision-resistant, URL-safe, and more
    compact than the original CUID. If the string is not a valid CUID2, the rule will
    return a failure Result with code 'String.InvalidCuid2'.
    `,
  });

export { Cuid2, InvalidCuid2 };
