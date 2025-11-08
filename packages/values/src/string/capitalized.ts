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
 * A rule that checks if the string is properly capitalized.
 *
 * @remarks
 * A capitalized string has the first letter uppercase (A-Z) and the rest lowercase (a-z).
 * Strings that are all lowercase, all uppercase, or have multiple words are rejected.
 * If the string is not properly capitalized, the rule will return an error Result with
 * code 'NOT_CAPITALIZED'.
 *
 * @public
 */
const Capitalized = rule(() =>
  n.assert((value: string) => capitalizedRegex.test(value), 'NOT_CAPITALIZED')
);

n.info(Capitalized)
  .type('string')
  .doc({
    title: 'Capitalized',
    body: n.doc`
    A rule that checks if the string is properly capitalized. A capitalized string has
    the first letter uppercase (A-Z) and the rest lowercase (a-z). Strings that are all
    lowercase, all uppercase, or have multiple words are rejected. If the string is not
    properly capitalized, the rule will return a failure Result with code 'NOT_CAPITALIZED'.
    `,
  });

export { Capitalized };
