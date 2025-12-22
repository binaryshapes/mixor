/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { rule } from '@nuxo/components';
import { n } from '@nuxo/core';

// Regular expression for hexadecimal validation (from Zod source code).
const hex = /^[0-9a-fA-F]+$/;

/**
 * Not hexadecimal failure.
 *
 * @internal
 */
class NotHexadecimal extends n.failure(
  'String.NotHexadecimal',
  {
    'en-US': 'The string must be a valid hexadecimal string.',
    'es-ES': 'El texto debe ser una cadena hexadecimal válida.',
  },
) {}

// Apply metadata to the NotHexadecimal failure.
n.info(NotHexadecimal)
  .doc({
    title: 'NotHexadecimal Failure',
    body: n.doc`
    A failure that is returned when the string is not a valid hexadecimal string.
    `,
  });

/**
 * A rule that checks if the string is a valid hexadecimal string.
 *
 * @remarks
 * A valid hexadecimal string contains only hexadecimal characters (0-9, A-F, a-f).
 * Strings that don't match this format are rejected. If the string is not a valid
 * hexadecimal string, the rule will return an error Result with code 'String.NotHexadecimal'.
 *
 * @public
 */
const Hexadecimal = rule(() => n.assert((value: string) => hex.test(value), new NotHexadecimal()));

n.info(Hexadecimal)
  .type('string')
  .doc({
    title: 'Hexadecimal',
    body: n.doc`
    A rule that checks if the string is a valid hexadecimal string. A valid hexadecimal
    string contains only hexadecimal characters (0-9, A-F, a-f). Strings that don't match
    this format are rejected. If the string is not a valid hexadecimal string, the rule
    will return a failure Result with code 'String.NotHexadecimal'.
    `,
  });

export { Hexadecimal, NotHexadecimal };
