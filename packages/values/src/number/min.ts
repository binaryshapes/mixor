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
 * Too small failure.
 *
 * @internal
 */
class TooSmall extends n.failure(
  'Number.TooSmall',
  {
    'en-US': 'The number must be at least {{min | number}}.',
    'es-ES': 'El número debe ser al menos {{min | number}}.',
  },
) {}

// Apply metadata to the TooSmall failure.
n.info(TooSmall)
  .doc({
    title: 'TooSmall Failure',
    body: n.doc`
    A failure that is returned when the number is less than the minimum value.
    `,
  });

/**
 * Creates a rule that checks if the number is greater than or equal to a minimum value.
 *
 * @remarks
 * A number is considered valid if it is greater than or equal to the specified minimum value.
 * For example, `Min(5)` will accept numbers like 5, 6, 7, etc.
 * If the number is less than the minimum value, the rule will return an error
 * Result with code 'Number.TooSmall'.
 *
 * @param minValue - The minimum value that the number must be greater than or equal to.
 * @returns A rule function that validates if the number meets the minimum requirement.
 *
 * @public
 */
const Min = rule((minValue: number) =>
  n.assert((value: number) => value >= minValue, new TooSmall({ min: minValue }))
);

n.info(Min)
  .type('number')
  .params(['minValue', 'number'])
  .doc({
    title: 'Min',
    body: n.doc`
    A rule that checks if the number is greater than or equal to a minimum value. A number is
    considered valid if it is greater than or equal to the specified minimum value. If the number
    is less than the minimum value, the rule will return a failure Result with code 'Number.TooSmall'.
    `,
  });

export { Min, TooSmall };

