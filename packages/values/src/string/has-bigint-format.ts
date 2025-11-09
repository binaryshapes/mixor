/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { rule } from '@nuxo/components';
import { n } from '@nuxo/core';

// Regular expression for BigInt validation (from Zod source code).
const bigintRegex = /^\d+n?$/;

/**
 * A rule that checks if the string has a valid BigInt format.
 *
 * @remarks
 * A valid BigInt string contains only digits and optionally ends with 'n'. Strings
 * with decimal points, letters, or other characters are rejected. If the string is not
 * a valid BigInt format, the rule will return an error Result with code 'NOT_BIGINT'.
 *
 * @public
 */
const HasBigIntFormat = rule(() =>
  n.assert((value: string) => bigintRegex.test(value), 'NOT_BIGINT')
);

n.info(HasBigIntFormat)
  .type('string')
  .doc({
    title: 'HasBigIntFormat',
    body: n.doc`
    A rule that checks if the string has a valid BigInt format. A valid BigInt string
    contains only digits and optionally ends with 'n'. Strings with decimal points,
    letters, or other characters are rejected. If the string is not a valid BigInt format,
    the rule will return a failure Result with code 'NOT_BIGINT'.
    `,
  });

export { HasBigIntFormat };
