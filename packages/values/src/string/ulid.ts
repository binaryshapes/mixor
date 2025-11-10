/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { rule } from '@nuxo/components';
import { n } from '@nuxo/core';

// Regular expression for ULID validation (from Zod source code).
const ulidRegex = /^[0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{26}$/;

/**
 * A rule that checks if the string is a valid ULID.
 *
 * @remarks
 * A valid ULID (Universally Unique Lexicographically Sortable Identifier) is a string
 * that contains exactly 26 characters from the set: numbers (0-9), uppercase letters
 * (A-Z, excluding I, O, U), and lowercase letters (a-z, excluding i, o, u). This
 * format is designed to be URL-safe and sortable by timestamp. If the string is not
 * a valid ULID, the rule will return an error Result with code 'INVALID_ULID'.
 *
 * @public
 */
const Ulid = rule(() => n.assert((value: string) => ulidRegex.test(value), 'INVALID_ULID'));

n.info(Ulid)
  .type('string')
  .doc({
    title: 'Ulid',
    body: n.doc`
    A rule that checks if the string is a valid ULID (Universally Unique Lexicographically
    Sortable Identifier). A valid ULID is a string that contains exactly 26 characters from
    the set: numbers (0-9), uppercase letters (A-Z, excluding I, O, U), and lowercase letters
    (a-z, excluding i, o, u). This format is designed to be URL-safe and sortable by timestamp.
    If the string is not a valid ULID, the rule will return a failure Result with code
    'INVALID_ULID'.
    `,
  });

export { Ulid };
