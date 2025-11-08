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
 * A rule that checks if the string contains only alphabetic characters.
 *
 * @remarks
 * An alphabetic string contains only letters (a-z, A-Z). Strings with numbers, spaces,
 * symbols, or special characters are rejected. If the string contains non-alphabetic
 * characters, the rule will return an error Result with code 'NOT_ALPHA'.
 *
 * @public
 */
const Alpha = rule(() => n.assert((value: string) => alphaRegex.test(value), 'NOT_ALPHA'));

n.info(Alpha)
  .type('string')
  .doc({
    title: 'Alpha',
    body: n.doc`
    A rule that checks if the string contains only alphabetic characters (a-z, A-Z).
    Strings with numbers, spaces, symbols, or special characters are rejected.
    If the string contains non-alphabetic characters, the rule will return a failure
    Result with code 'NOT_ALPHA'.
    `,
  });

export { Alpha };
