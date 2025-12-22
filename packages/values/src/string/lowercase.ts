/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { rule } from '@nuxo/components';
import { n } from '@nuxo/core';

// Regular expression for lowercase validation (from Zod source code).
const lowercaseRegex = /^[a-z]+$/;

/**
 * Not lowercase failure.
 *
 * @internal
 */
class NotLowercase extends n.failure(
  'String.NotLowercase',
  {
    'en-US': 'The string must contain only lowercase letters.',
    'es-ES': 'El texto debe contener solo letras minúsculas.',
  },
) {}

// Apply metadata to the NotLowercase failure.
n.info(NotLowercase)
  .doc({
    title: 'NotLowercase Failure',
    body: n.doc`
    A failure that is returned when the string contains non-lowercase characters.
    `,
  });

/**
 * A rule that checks if the string contains only lowercase letters.
 *
 * @remarks
 * A valid lowercase string contains only lowercase letters (a-z). It rejects uppercase
 * letters, numbers, spaces, symbols, and special characters. If the string contains
 * non-lowercase characters, the rule will return an error Result with code 'String.NotLowercase'.
 *
 * @public
 */
const Lowercase = rule(() =>
  n.assert((value: string) => lowercaseRegex.test(value), new NotLowercase())
);

n.info(Lowercase)
  .type('string')
  .doc({
    title: 'Lowercase',
    body: n.doc`
    A rule that checks if the string contains only lowercase letters. A valid lowercase string
    contains only lowercase letters (a-z). It rejects uppercase letters, numbers, spaces,
    symbols, and special characters. If the string contains non-lowercase characters, the rule
    will return a failure Result with code 'String.NotLowercase'.
    `,
  });

export { Lowercase, NotLowercase };
