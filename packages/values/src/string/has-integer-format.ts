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
 * A rule that checks if the string has a valid integer format.
 *
 * @remarks
 * A valid integer string contains only digits (0-9). Strings with decimal points,
 * letters, or other characters are rejected. If the string is not a valid integer format,
 * the rule will return an error Result with code 'NOT_INTEGER'.
 *
 * @public
 */
const HasIntegerFormat = rule(() =>
  n.assert((value: string) => integerRegex.test(value), 'NOT_INTEGER')
);

n.info(HasIntegerFormat)
  .type('string')
  .doc({
    title: 'HasIntegerFormat',
    body: n.doc`
    A rule that checks if the string has a valid integer format. A valid integer string
    contains only digits (0-9). Strings with decimal points, letters, or other characters
    are rejected. If the string is not a valid integer format, the rule will return a
    failure Result with code 'NOT_INTEGER'.
    `,
  });

export { HasIntegerFormat };
