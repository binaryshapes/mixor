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
 * Creates a rule that checks if the number is a multiple of a specified divisor.
 *
 * @remarks
 * A number is a multiple of the divisor if it can be divided evenly by the divisor
 * (i.e., the remainder is 0). For example, `MultipleOf(5)` will accept numbers
 * like 5, 10, 15, 20, etc. If the number is not a multiple of the divisor, the rule
 * will return an error Result with code 'NOT_MULTIPLE_OF'.
 *
 * @param divisor - The divisor to check multiples against.
 * @returns A rule function that validates if the number is a multiple of the divisor.
 *
 * @public
 */
const MultipleOf = rule((divisor: number) =>
  n.assert((value: number) => value % divisor === 0, 'NOT_MULTIPLE_OF')
);

n.info(MultipleOf)
  .type('number')
  .params(['divisor', 'number'])
  .doc({
    title: 'MultipleOf',
    body: n.doc`
    A rule that checks if the number is a multiple of a specified divisor. A number is a
    multiple of the divisor if it can be divided evenly by the divisor (i.e., the remainder
    is 0). If the number is not a multiple of the divisor, the rule will return a failure
    Result with code 'NOT_MULTIPLE_OF'.
    `,
  });

export { MultipleOf };

