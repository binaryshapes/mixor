/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { rule } from '@nuxo/components';
import { n } from '@nuxo/core';

// Regular expression for capitalized validation (from Zod source code).
const capitalizedRegex = /^[A-Z][a-z]*$/;

/**
 * Not capitalized failure.
 *
 * @internal
 */
class NotCapitalized extends n.failure(
  'String.NotCapitalized',
  {
    'en-US': 'The string must be properly capitalized.',
    'es-ES': 'El texto debe estar correctamente capitalizado.',
  },
) {}

// Apply metadata to the NotCapitalized failure.
n.info(NotCapitalized)
  .doc({
    title: 'NotCapitalized Failure',
    body: n.doc`
    A failure that is returned when the string is not properly capitalized.
    `,
  });

/**
 * A rule that checks if the string is properly capitalized.
 *
 * @remarks
 * A capitalized string has the first letter uppercase (A-Z) and the rest lowercase (a-z).
 * Strings that are all lowercase, all uppercase, or have multiple words are rejected.
 * If the string is not properly capitalized, the rule will return an error Result with
 * code 'String.NotCapitalized'.
 *
 * @public
 */
const Capitalized = rule(() =>
  n.assert((value: string) => capitalizedRegex.test(value), new NotCapitalized())
);

n.info(Capitalized)
  .type('string')
  .doc({
    title: 'Capitalized',
    body: n.doc`
    A rule that checks if the string is properly capitalized. A capitalized string has
    the first letter uppercase (A-Z) and the rest lowercase (a-z). Strings that are all
    lowercase, all uppercase, or have multiple words are rejected. If the string is not
    properly capitalized, the rule will return a failure Result with code 'String.NotCapitalized'.
    `,
  });

export { Capitalized, NotCapitalized };
