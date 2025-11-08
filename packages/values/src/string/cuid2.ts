/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { rule } from '@nuxo/components';
import { n } from '@nuxo/core';

// Regular expression for CUID2 validation (from Zod source code).
const cuid2Regex = /^[0-9a-z]+$/;

/**
 * A rule that checks if the string is a valid CUID2.
 *
 * @remarks
 * A valid CUID2 (Collision-resistant Unique IDentifier version 2) is a string that
 * contains only lowercase letters (a-z) and numbers (0-9). This format is designed
 * to be collision-resistant, URL-safe, and more compact than the original CUID.
 * If the string is not a valid CUID2, the rule will return an error Result with code
 * 'INVALID_CUID2'.
 *
 * @public
 */
const Cuid2 = rule(() => n.assert((value: string) => cuid2Regex.test(value), 'INVALID_CUID2'));

n.info(Cuid2)
  .type('string')
  .doc({
    title: 'Cuid2',
    body: n.doc`
    A rule that checks if the string is a valid CUID2 (Collision-resistant Unique IDentifier
    version 2). A valid CUID2 is a string that contains only lowercase letters (a-z) and
    numbers (0-9). This format is designed to be collision-resistant, URL-safe, and more
    compact than the original CUID. If the string is not a valid CUID2, the rule will
    return a failure Result with code 'INVALID_CUID2'.
    `,
  });

export { Cuid2 };
