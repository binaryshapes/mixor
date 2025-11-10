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
 * A rule that checks if the string contains only uppercase letters.
 *
 * @remarks
 * A valid uppercase string contains only uppercase letters (A-Z). It rejects lowercase
 * letters, numbers, spaces, symbols, and special characters. If the string contains
 * non-uppercase characters, the rule will return an error Result with code 'NOT_UPPERCASE'.
 *
 * @public
 */
const Uppercase = rule(() =>
  n.assert((value: string) => uppercaseRegex.test(value), 'NOT_UPPERCASE')
);

n.info(Uppercase)
  .type('string')
  .doc({
    title: 'Uppercase',
    body: n.doc`
    A rule that checks if the string contains only uppercase letters. A valid uppercase string
    contains only uppercase letters (A-Z). It rejects lowercase letters, numbers, spaces,
    symbols, and special characters. If the string contains non-uppercase characters, the rule
    will return a failure Result with code 'NOT_UPPERCASE'.
    `,
  });

export { Uppercase };
