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
 * Too large failure.
 *
 * @internal
 */
class TooLarge extends n.failure(
  'Number.TooLarge',
  {
    'en-US': 'The number must be at most {{max | number}}.',
    'es-ES': 'El número debe ser como máximo {{max | number}}.',
  },
) {}

// Apply metadata to the TooLarge failure.
n.info(TooLarge)
  .doc({
    title: 'TooLarge Failure',
    body: n.doc`
    A failure that is returned when the number is greater than the maximum value.
    `,
  });

/**
 * Creates a rule that checks if the number is less than or equal to a maximum value.
 *
 * @remarks
 * A number is considered valid if it is less than or equal to the specified maximum value.
 * For example, `Max(10)` will accept numbers like 8, 9, 10, etc.
 * If the number is greater than the maximum value, the rule will return an error
 * Result with code 'Number.TooLarge'.
 *
 * @param maxValue - The maximum value that the number must be less than or equal to.
 * @returns A rule function that validates if the number meets the maximum requirement.
 *
 * @public
 */
const Max = rule((maxValue: number) =>
  n.assert((value: number) => value <= maxValue, new TooLarge({ max: maxValue }))
);

n.info(Max)
  .type('number')
  .params(['maxValue', 'number'])
  .doc({
    title: 'Max',
    body: n.doc`
    A rule that checks if the number is less than or equal to a maximum value. A number is
    considered valid if it is less than or equal to the specified maximum value. If the number
    is greater than the maximum value, the rule will return a failure Result with code
    'Number.TooLarge'.
    `,
  });

export { Max, TooLarge };

