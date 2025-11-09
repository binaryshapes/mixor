/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { rule } from '@nuxo/components';
import { n } from '@nuxo/core';

// Regular expression for hexadecimal validation (from Zod source code).
const hex = /^[0-9a-fA-F]+$/;

/**
 * A rule that checks if the string is a valid hexadecimal string.
 *
 * @remarks
 * A valid hexadecimal string contains only hexadecimal characters (0-9, A-F, a-f).
 * Strings that don't match this format are rejected. If the string is not a valid
 * hexadecimal string, the rule will return an error Result with code 'NOT_HEXADECIMAL'.
 *
 * @public
 */
const Hexadecimal = rule(() => n.assert((value: string) => hex.test(value), 'NOT_HEXADECIMAL'));

n.info(Hexadecimal)
  .type('string')
  .doc({
    title: 'Hexadecimal',
    body: n.doc`
    A rule that checks if the string is a valid hexadecimal string. A valid hexadecimal
    string contains only hexadecimal characters (0-9, A-F, a-f). Strings that don't match
    this format are rejected. If the string is not a valid hexadecimal string, the rule
    will return a failure Result with code 'NOT_HEXADECIMAL'.
    `,
  });

export { Hexadecimal };
