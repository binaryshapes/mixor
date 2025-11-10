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
 * Creates a rule that checks if the number is greater than or equal to a specified value.
 *
 * @remarks
 * A number is considered valid if it is greater than or equal to the specified value.
 * For example, `Gte(5)` will accept numbers like 5, 6, 7, 8, etc.
 * If the number is not greater than or equal to the threshold, the rule will return
 * an error Result with code 'NOT_GREATER_THAN_OR_EQUAL'.
 *
 * @param threshold - The value that the number must be greater than or equal to.
 * @returns A rule function that validates if the number is greater than or equal to the threshold.
 *
 * @public
 */
const Gte = rule((threshold: number) =>
  n.assert((value: number) => value >= threshold, 'NOT_GREATER_THAN_OR_EQUAL')
);

n.info(Gte)
  .type('number')
  .params(['threshold', 'number'])
  .doc({
    title: 'Gte',
    body: n.doc`
    A rule that checks if the number is greater than or equal to a specified value. A number
    is considered valid if it is greater than or equal to the specified value. If the number
    is not greater than or equal to the threshold, the rule will return a failure Result with
    code 'NOT_GREATER_THAN_OR_EQUAL'.
    `,
  });

export { Gte };

