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
 * A rule that checks if the number is non-negative (≥ 0).
 *
 * @remarks
 * A non-negative number is any number that is greater than or equal to zero.
 * This rule accepts 0 and positive numbers, rejecting negative numbers.
 * If the number is negative, the rule will return an error Result with
 * code 'NEGATIVE'.
 *
 * @public
 */
const Nonnegative = rule(() => n.assert((value: number) => value >= 0, 'NEGATIVE'));

n.info(Nonnegative)
  .type('number')
  .doc({
    title: 'Nonnegative',
    body: n.doc`
    A rule that checks if the number is non-negative (≥ 0). A non-negative number is any
    number that is greater than or equal to zero. This rule accepts 0 and positive numbers,
    rejecting negative numbers. If the number is negative, the rule will return a failure
    Result with code 'NEGATIVE'.
    `,
  });

export { Nonnegative };

