/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { rule } from '@nuxo/components';
import { n } from '@nuxo/core';

// Regular expression for alphanumeric validation (from Zod source code).
const alphanumericRegex = /^[a-zA-Z0-9]+$/;

/**
 * Not alphanumeric failure.
 *
 * @internal
 */
class NotAlphanumeric extends n.failure(
  'String.NotAlphanumeric',
  {
    'en-US': 'The string must contain only alphanumeric characters.',
    'es-ES': 'El texto debe contener solo caracteres alfanuméricos.',
  },
) {}

// Apply metadata to the NotAlphanumeric failure.
n.info(NotAlphanumeric)
  .doc({
    title: 'NotAlphanumeric Failure',
    body: n.doc`
    A failure that is returned when the string contains non-alphanumeric characters.
    `,
  });

/**
 * A rule that checks if the string contains only alphanumeric characters.
 *
 * @remarks
 * An alphanumeric string contains only letters (a-z, A-Z) and numbers (0-9). Strings
 * with spaces, symbols, or special characters are rejected. If the string contains
 * non-alphanumeric characters, the rule will return an error Result with code 'String.NotAlphanumeric'.
 *
 * @public
 */
const Alphanumeric = rule(() =>
  n.assert((value: string) => alphanumericRegex.test(value), new NotAlphanumeric())
);

n.info(Alphanumeric)
  .type('string')
  .doc({
    title: 'Alphanumeric',
    body: n.doc`
    A rule that checks if the string contains only alphanumeric characters (a-z, A-Z, 0-9).
    Strings with spaces, symbols, or special characters are rejected.
    If the string contains non-alphanumeric characters, the rule will return a failure
    Result with code 'String.NotAlphanumeric'.
    `,
  });

export { Alphanumeric, NotAlphanumeric };
