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
 * Not BigInt format failure.
 *
 * @internal
 */
class NotBigIntFormat extends n.failure(
  'String.NotBigIntFormat',
  {
    'en-US': 'The string must have a valid BigInt format.',
    'es-ES': 'El texto debe tener un formato BigInt válido.',
  },
) {}

// Apply metadata to the NotBigIntFormat failure.
n.info(NotBigIntFormat)
  .doc({
    title: 'NotBigIntFormat Failure',
    body: n.doc`
    A failure that is returned when the string does not have a valid BigInt format.
    `,
  });

/**
 * A rule that checks if the string has a valid BigInt format.
 *
 * @remarks
 * A valid BigInt string contains only digits and optionally ends with 'n'. Strings
 * with decimal points, letters, or other characters are rejected. If the string is not
 * a valid BigInt format, the rule will return an error Result with code 'String.NotBigIntFormat'.
 *
 * @public
 */
const HasBigIntFormat = rule(() =>
  n.assert((value: string) => bigintRegex.test(value), new NotBigIntFormat())
);

n.info(HasBigIntFormat)
  .type('string')
  .doc({
    title: 'HasBigIntFormat',
    body: n.doc`
    A rule that checks if the string has a valid BigInt format. A valid BigInt string
    contains only digits and optionally ends with 'n'. Strings with decimal points,
    letters, or other characters are rejected. If the string is not a valid BigInt format,
    the rule will return a failure Result with code 'String.NotBigIntFormat'.
    `,
  });

export { HasBigIntFormat, NotBigIntFormat };
