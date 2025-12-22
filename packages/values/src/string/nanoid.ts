/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { rule } from '@nuxo/components';
import { n } from '@nuxo/core';

// Regular expression for NanoID validation (from Zod source code).
const nanoidRegex = /^[a-zA-Z0-9_-]{21}$/;

/**
 * Invalid NanoID failure.
 *
 * @internal
 */
class InvalidNanoid extends n.failure(
  'String.InvalidNanoid',
  {
    'en-US': 'The string must be a valid NanoID.',
    'es-ES': 'El texto debe ser un NanoID válido.',
  },
) {}

// Apply metadata to the InvalidNanoid failure.
n.info(InvalidNanoid)
  .doc({
    title: 'InvalidNanoid Failure',
    body: n.doc`
    A failure that is returned when the string is not a valid NanoID.
    `,
  });

/**
 * A rule that checks if the string is a valid NanoID.
 *
 * @remarks
 * A valid NanoID is a string that contains exactly 21 characters from the set:
 * lowercase letters (a-z), uppercase letters (A-Z), numbers (0-9), underscores (_),
 * and hyphens (-). This format is commonly used for generating URL-safe unique
 * identifiers. If the string is not a valid NanoID, the rule will return an error
 * Result with code 'String.InvalidNanoid'.
 *
 * @public
 */
const Nanoid = rule(() => n.assert((value: string) => nanoidRegex.test(value), new InvalidNanoid()));

n.info(Nanoid)
  .type('string')
  .doc({
    title: 'Nanoid',
    body: n.doc`
    A rule that checks if the string is a valid NanoID. A valid NanoID is a string that
    contains exactly 21 characters from the set: lowercase letters (a-z), uppercase letters
    (A-Z), numbers (0-9), underscores (_), and hyphens (-). This format is commonly used
    for generating URL-safe unique identifiers. If the string is not a valid NanoID, the
    rule will return a failure Result with code 'String.InvalidNanoid'.
    `,
  });

export { Nanoid, InvalidNanoid };
