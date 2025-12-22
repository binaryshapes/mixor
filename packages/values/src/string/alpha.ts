/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { rule } from '@nuxo/components';
import { n } from '@nuxo/core';

// Regular expression for alphabetic validation (from Zod source code).
const alphaRegex = /^[a-zA-Z]+$/;

/**
 * Not alpha failure.
 *
 * @internal
 */
class NotAlpha extends n.failure(
  'String.NotAlpha',
  {
    'en-US': 'The string must contain only alphabetic characters.',
    'es-ES': 'El texto debe contener solo caracteres alfabéticos.',
  },
) {}

// Apply metadata to the NotAlpha failure.
n.info(NotAlpha)
  .doc({
    title: 'NotAlpha Failure',
    body: n.doc`
    A failure that is returned when the string contains non-alphabetic characters.
    `,
  });

/**
 * A rule that checks if the string contains only alphabetic characters.
 *
 * @remarks
 * An alphabetic string contains only letters (a-z, A-Z). Strings with numbers, spaces,
 * symbols, or special characters are rejected. If the string contains non-alphabetic
 * characters, the rule will return an error Result with code 'String.NotAlpha'.
 *
 * @public
 */
const Alpha = rule(() => n.assert((value: string) => alphaRegex.test(value), new NotAlpha()));

n.info(Alpha)
  .type('string')
  .doc({
    title: 'Alpha',
    body: n.doc`
    A rule that checks if the string contains only alphabetic characters (a-z, A-Z).
    Strings with numbers, spaces, symbols, or special characters are rejected.
    If the string contains non-alphabetic characters, the rule will return a failure
    Result with code 'String.NotAlpha'.
    `,
  });

export { Alpha, NotAlpha };
