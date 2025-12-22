/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { rule } from '@nuxo/components';
import { n } from '@nuxo/core';

// Regular expression for integer validation (from Zod source code).
const integerRegex = /^\d+$/;

/**
 * Not integer format failure.
 *
 * @internal
 */
class NotIntegerFormat extends n.failure(
  'String.NotIntegerFormat',
  {
    'en-US': 'The string must have a valid integer format.',
    'es-ES': 'El texto debe tener un formato entero válido.',
  },
) {}

// Apply metadata to the NotIntegerFormat failure.
n.info(NotIntegerFormat)
  .doc({
    title: 'NotIntegerFormat Failure',
    body: n.doc`
    A failure that is returned when the string does not have a valid integer format.
    `,
  });

/**
 * A rule that checks if the string has a valid integer format.
 *
 * @remarks
 * A valid integer string contains only digits (0-9). Strings with decimal points,
 * letters, or other characters are rejected. If the string is not a valid integer format,
 * the rule will return an error Result with code 'String.NotIntegerFormat'.
 *
 * @public
 */
const HasIntegerFormat = rule(() =>
  n.assert((value: string) => integerRegex.test(value), new NotIntegerFormat())
);

n.info(HasIntegerFormat)
  .type('string')
  .doc({
    title: 'HasIntegerFormat',
    body: n.doc`
    A rule that checks if the string has a valid integer format. A valid integer string
    contains only digits (0-9). Strings with decimal points, letters, or other characters
    are rejected. If the string is not a valid integer format, the rule will return a
    failure Result with code 'String.NotIntegerFormat'.
    `,
  });

export { HasIntegerFormat, NotIntegerFormat };
