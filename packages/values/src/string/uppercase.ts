/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { rule } from '@nuxo/components';
import { n } from '@nuxo/core';

// Regular expression for uppercase validation (from Zod source code).
const uppercaseRegex = /^[A-Z]+$/;

/**
 * Not uppercase failure.
 *
 * @internal
 */
class NotUppercase extends n.failure(
  'String.NotUppercase',
  {
    'en-US': 'The string must contain only uppercase letters.',
    'es-ES': 'El texto debe contener solo letras mayúsculas.',
  },
) {}

// Apply metadata to the NotUppercase failure.
n.info(NotUppercase)
  .doc({
    title: 'NotUppercase Failure',
    body: n.doc`
    A failure that is returned when the string contains non-uppercase characters.
    `,
  });

/**
 * A rule that checks if the string contains only uppercase letters.
 *
 * @remarks
 * A valid uppercase string contains only uppercase letters (A-Z). It rejects lowercase
 * letters, numbers, spaces, symbols, and special characters. If the string contains
 * non-uppercase characters, the rule will return an error Result with code 'String.NotUppercase'.
 *
 * @public
 */
const Uppercase = rule(() =>
  n.assert((value: string) => uppercaseRegex.test(value), new NotUppercase())
);

n.info(Uppercase)
  .type('string')
  .doc({
    title: 'Uppercase',
    body: n.doc`
    A rule that checks if the string contains only uppercase letters. A valid uppercase string
    contains only uppercase letters (A-Z). It rejects lowercase letters, numbers, spaces,
    symbols, and special characters. If the string contains non-uppercase characters, the rule
    will return a failure Result with code 'String.NotUppercase'.
    `,
  });

export { Uppercase, NotUppercase };
