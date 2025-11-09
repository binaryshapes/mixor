/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { rule } from '@nuxo/components';
import { n } from '@nuxo/core';

// Regular expression for number validation (from Zod source code).
const numberRegex = /^-?\d+(?:\.\d+)?/i;

/**
 * A rule that checks if the string has a valid number format.
 *
 * @remarks
 * A valid number string represents a number, including integers and decimals. It can
 * start with an optional minus sign and include decimal points. If the string is not
 * a valid number format, the rule will return an error Result with code 'NOT_NUMBER'.
 *
 * @public
 */
const HasNumberFormat = rule(() =>
  n.assert((value: string) => numberRegex.test(value), 'NOT_NUMBER')
);

n.info(HasNumberFormat)
  .type('string')
  .doc({
    title: 'HasNumberFormat',
    body: n.doc`
    A rule that checks if the string has a valid number format. A valid number string
    represents a number, including integers and decimals. It can start with an optional
    minus sign and include decimal points. If the string is not a valid number format,
    the rule will return a failure Result with code 'NOT_NUMBER'.
    `,
  });

export { HasNumberFormat };
