/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { rule } from '@nuxo/components';
import { n } from '@nuxo/core';

// Regular expression for boolean validation (from Zod source code).
const booleanRegex = /true|false/i;

/**
 * A rule that checks if the string has a valid boolean format.
 *
 * @remarks
 * A valid boolean string contains "true" or "false" (case insensitive). Strings
 * with other values or formats are rejected. If the string is not a valid boolean format,
 * the rule will return an error Result with code 'NOT_BOOLEAN'.
 *
 * @public
 */
const HasBooleanFormat = rule(() =>
  n.assert((value: string) => booleanRegex.test(value), 'NOT_BOOLEAN')
);

n.info(HasBooleanFormat)
  .type('string')
  .doc({
    title: 'HasBooleanFormat',
    body: n.doc`
    A rule that checks if the string has a valid boolean format. A valid boolean string
    contains "true" or "false" (case insensitive). Strings with other values or formats
    are rejected. If the string is not a valid boolean format, the rule will return a
    failure Result with code 'NOT_BOOLEAN'.
    `,
  });

export { HasBooleanFormat };
