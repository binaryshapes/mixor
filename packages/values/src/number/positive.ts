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
 * Not positive failure.
 *
 * @internal
 */
class NotPositive extends n.failure(
  'Number.NotPositive',
  {
    'en-US': 'The number must be positive.',
    'es-ES': 'El número debe ser positivo.',
  },
) {}

// Apply metadata to the NotPositive failure.
n.info(NotPositive)
  .doc({
    title: 'NotPositive Failure',
    body: n.doc`
    A failure that is returned when the number is not positive (greater than 0).
    `,
  });

/**
 * A rule that checks if the number is positive (greater than 0).
 *
 * @remarks
 * A positive number is any number that is greater than zero.
 * This rule accepts only positive numbers, rejecting 0 and negative numbers.
 * If the number is not positive, the rule will return an error Result with
 * code 'Number.NotPositive'.
 *
 * @public
 */
const Positive = rule(() => n.assert((value: number) => value > 0, new NotPositive()));

n.info(Positive)
  .type('number')
  .doc({
    title: 'Positive',
    body: n.doc`
    A rule that checks if the number is positive (greater than 0). A positive number is any
    number that is greater than zero. This rule accepts only positive numbers, rejecting 0 and
    negative numbers. If the number is not positive, the rule will return a failure Result
    with code 'Number.NotPositive'.
    `,
  });

export { Positive, NotPositive };

