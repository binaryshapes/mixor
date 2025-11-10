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
 * A rule that checks if the string contains only lowercase letters.
 *
 * @remarks
 * A valid lowercase string contains only lowercase letters (a-z). It rejects uppercase
 * letters, numbers, spaces, symbols, and special characters. If the string contains
 * non-lowercase characters, the rule will return an error Result with code 'NOT_LOWERCASE'.
 *
 * @public
 */
const Lowercase = rule(() =>
  n.assert((value: string) => lowercaseRegex.test(value), 'NOT_LOWERCASE')
);

n.info(Lowercase)
  .type('string')
  .doc({
    title: 'Lowercase',
    body: n.doc`
    A rule that checks if the string contains only lowercase letters. A valid lowercase string
    contains only lowercase letters (a-z). It rejects uppercase letters, numbers, spaces,
    symbols, and special characters. If the string contains non-lowercase characters, the rule
    will return a failure Result with code 'NOT_LOWERCASE'.
    `,
  });

export { Lowercase };
