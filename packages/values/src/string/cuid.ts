/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { rule } from '@nuxo/components';
import { n } from '@nuxo/core';

// Regular expression for CUID validation (from Zod source code).
const cuidRegex = /^[cC][^\s-]{8,}$/;

/**
 * Invalid CUID failure.
 *
 * @internal
 */
class InvalidCuid extends n.failure(
  'String.InvalidCuid',
  {
    'en-US': 'The string must be a valid CUID.',
    'es-ES': 'El texto debe ser un CUID válido.',
  },
) {}

// Apply metadata to the InvalidCuid failure.
n.info(InvalidCuid)
  .doc({
    title: 'InvalidCuid Failure',
    body: n.doc`
    A failure that is returned when the string is not a valid CUID.
    `,
  });

/**
 * A rule that checks if the string is a valid CUID.
 *
 * @remarks
 * A valid CUID (Collision-resistant Unique IDentifier) is a string that starts with
 * either 'c' or 'C', followed by at least 8 characters that are not whitespace or
 * hyphens. This format is designed to be collision-resistant and URL-safe.
 * If the string is not a valid CUID, the rule will return an error Result with code 'String.InvalidCuid'.
 *
 * @public
 */
const Cuid = rule(() => n.assert((value: string) => cuidRegex.test(value), new InvalidCuid()));

n.info(Cuid)
  .type('string')
  .doc({
    title: 'Cuid',
    body: n.doc`
    A rule that checks if the string is a valid CUID (Collision-resistant Unique IDentifier).
    A valid CUID is a string that starts with either 'c' or 'C', followed by at least 8
    characters that are not whitespace or hyphens. This format is designed to be
    collision-resistant and URL-safe. If the string is not a valid CUID, the rule will
    return a failure Result with code 'String.InvalidCuid'.
    `,
  });

export { Cuid, InvalidCuid };
