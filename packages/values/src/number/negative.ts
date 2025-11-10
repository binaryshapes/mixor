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
 * A rule that checks if the number is negative (less than 0).
 *
 * @remarks
 * A negative number is any number that is less than zero.
 * This rule accepts only negative numbers, rejecting 0 and positive numbers.
 * If the number is not negative, the rule will return an error Result with
 * code 'NOT_NEGATIVE'.
 *
 * @public
 */
const Negative = rule(() => n.assert((value: number) => value < 0, 'NOT_NEGATIVE'));

n.info(Negative)
  .type('number')
  .doc({
    title: 'Negative',
    body: n.doc`
    A rule that checks if the number is negative (less than 0). A negative number is any
    number that is less than zero. This rule accepts only negative numbers, rejecting 0 and
    positive numbers. If the number is not negative, the rule will return a failure Result
    with code 'NOT_NEGATIVE'.
    `,
  });

export { Negative };

