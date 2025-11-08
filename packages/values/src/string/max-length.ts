/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { rule } from '@nuxo/components';
import { n } from '@nuxo/core';

/**
 * Creates a rule that checks if the string has a maximum length.
 *
 * @remarks
 * A string is considered valid if it has fewer or equal characters than the maximum length.
 * If the string is longer than the maximum length, the rule will return an error Result
 * with code 'TOO_LONG'.
 *
 * @param maxLength - The maximum length of the string.
 * @returns A rule function that validates the string length.
 *
 * @public
 */
const MaxLength = rule((maxLength: number) =>
  n.assert((value: string) => value.length <= maxLength, 'TOO_LONG')
);

n.info(MaxLength)
  .type('string')
  .params(['maxLength', 'number'])
  .doc({
    title: 'MaxLength',
    body: n.doc`
      A rule that checks if the string has a maximum length of "n" characters.
      If the string is longer than the maximum length, the rule will return a failure
      Result with code 'TOO_LONG'.
      `,
  });

export { MaxLength };
