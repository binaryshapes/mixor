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
 * Not negative failure.
 *
 * @internal
 */
class NotNegative extends n.failure(
  'Number.NotNegative',
  {
    'en-US': 'The number must be negative.',
    'es-ES': 'El número debe ser negativo.',
  },
) {}

// Apply metadata to the NotNegative failure.
n.info(NotNegative)
  .doc({
    title: 'NotNegative Failure',
    body: n.doc`
    A failure that is returned when the number is not negative (less than 0).
    `,
  });

/**
 * A rule that checks if the number is negative (less than 0).
 *
 * @remarks
 * A negative number is any number that is less than zero.
 * This rule accepts only negative numbers, rejecting 0 and positive numbers.
 * If the number is not negative, the rule will return an error Result with
 * code 'Number.NotNegative'.
 *
 * @public
 */
const Negative = rule(() => n.assert((value: number) => value < 0, new NotNegative()));

n.info(Negative)
  .type('number')
  .doc({
    title: 'Negative',
    body: n.doc`
    A rule that checks if the number is negative (less than 0). A negative number is any
    number that is less than zero. This rule accepts only negative numbers, rejecting 0 and
    positive numbers. If the number is not negative, the rule will return a failure Result
    with code 'Number.NotNegative'.
    `,
  });

export { Negative, NotNegative };
