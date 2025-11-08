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
 * Creates a rule that checks if the string has a minimum length.
 *
 * @remarks
 * A string is considered valid if it has more or equal characters than the minimum length.
 * If the string is shorter than the minimum length, the rule will return an error Result
 * with code 'TOO_SHORT'.
 *
 * @param minLength - The minimum length of the string.
 * @returns A rule function that validates the string length.
 *
 * @public
 */
const MinLength = rule((minLength: number) =>
  n.assert((value: string) => value.length >= minLength, 'TOO_SHORT')
);

n.info(MinLength)
  .type('string')
  .params(['minLength', 'number'])
  .doc({
    title: 'MinLength',
    body: n.doc`
      A rule that checks if the string has a minimum length of "n" characters.
      If the string is shorter than the minimum length, the rule will return a failure
      Result with code 'TOO_SHORT'.
      `,
  });

export { MinLength };
