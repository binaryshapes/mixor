/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { rule } from '@nuxo/components';
import { n } from '@nuxo/core';

// Regular expression for CUID validation (from Zod source code).
const cuidRegex = /^[cC][^\s-]{8,}$/;

/**
 * A rule that checks if the string is a valid CUID.
 *
 * @remarks
 * A valid CUID (Collision-resistant Unique IDentifier) is a string that starts with
 * either 'c' or 'C', followed by at least 8 characters that are not whitespace or
 * hyphens. This format is designed to be collision-resistant and URL-safe.
 * If the string is not a valid CUID, the rule will return an error Result with code 'INVALID_CUID'.
 *
 * @public
 */
const Cuid = rule(() => n.assert((value: string) => cuidRegex.test(value), 'INVALID_CUID'));

n.info(Cuid)
  .type('string')
  .doc({
    title: 'Cuid',
    body: n.doc`
    A rule that checks if the string is a valid CUID (Collision-resistant Unique IDentifier).
    A valid CUID is a string that starts with either 'c' or 'C', followed by at least 8
    characters that are not whitespace or hyphens. This format is designed to be
    collision-resistant and URL-safe. If the string is not a valid CUID, the rule will
    return a failure Result with code 'INVALID_CUID'.
    `,
  });

export { Cuid };
