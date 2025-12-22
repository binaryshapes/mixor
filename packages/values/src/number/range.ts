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
 * Out of range failure.
 *
 * @internal
 */
class OutOfRange extends n.failure(
  'Number.OutOfRange',
  {
    'en-US': 'The number must be between {{min | number}} and {{max | number}}.',
    'es-ES': 'El número debe estar entre {{min | number}} y {{max | number}}.',
  },
) {}

// Apply metadata to the OutOfRange failure.
n.info(OutOfRange)
  .doc({
    title: 'OutOfRange Failure',
    body: n.doc`
    A failure that is returned when the number is outside the specified range.
    `,
  });

/**
 * Creates a rule that checks if the number is within a specified range.
 *
 * @remarks
 * A number is considered valid if it is greater than or equal to the minimum value
 * and less than or equal to the maximum value. For example, `Range(5, 10)` will
 * accept numbers like 5, 6, 7, 8, 9, 10. If the number is outside the specified range,
 * the rule will return an error Result with code 'Number.OutOfRange'.
 *
 * @param min - The minimum value (inclusive).
 * @param max - The maximum value (inclusive).
 * @returns A rule function that validates if the number is within the range.
 *
 * @public
 */
const Range = rule((min: number, max: number) =>
  n.assert((value: number) => value >= min && value <= max, new OutOfRange({ min, max }))
);

n.info(Range)
  .type('number')
  .params(['min', 'number'], ['max', 'number'])
  .doc({
    title: 'Range',
    body: n.doc`
    A rule that checks if the number is within a specified range. A number is considered valid
    if it is greater than or equal to the minimum value and less than or equal to the maximum
    value. If the number is outside the specified range, the rule will return a failure Result
    with code 'Number.OutOfRange'.
    `,
  });

export { Range, OutOfRange };

