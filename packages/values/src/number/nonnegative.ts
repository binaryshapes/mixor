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
 * Negative failure.
 *
 * @internal
 */
class Negative extends n.failure(
  'Number.Negative',
  {
    'en-US': 'The number must be non-negative.',
    'es-ES': 'El número debe ser no negativo.',
  },
) {}

// Apply metadata to the Negative failure.
n.info(Negative)
  .doc({
    title: 'Negative Failure',
    body: n.doc`
    A failure that is returned when the number is negative (less than 0).
    `,
  });

/**
 * A rule that checks if the number is non-negative (≥ 0).
 *
 * @remarks
 * A non-negative number is any number that is greater than or equal to zero.
 * This rule accepts 0 and positive numbers, rejecting negative numbers.
 * If the number is negative, the rule will return an error Result with
 * code 'Number.Negative'.
 *
 * @public
 */
const Nonnegative = rule(() => n.assert((value: number) => value >= 0, new Negative()));

n.info(Nonnegative)
  .type('number')
  .doc({
    title: 'Nonnegative',
    body: n.doc`
    A rule that checks if the number is non-negative (≥ 0). A non-negative number is any
    number that is greater than or equal to zero. This rule accepts 0 and positive numbers,
    rejecting negative numbers. If the number is negative, the rule will return a failure
    Result with code 'Number.Negative'.
    `,
  });

export { Nonnegative };
