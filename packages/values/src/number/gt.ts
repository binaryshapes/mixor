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
 * Not greater than failure.
 *
 * @internal
 */
class NotGreaterThan extends n.failure(
  'Number.NotGreaterThan',
  {
    'en-US': 'The number must be greater than {{threshold | number}}.',
    'es-ES': 'El número debe ser mayor que {{threshold | number}}.',
  },
) {}

// Apply metadata to the NotGreaterThan failure.
n.info(NotGreaterThan)
  .doc({
    title: 'NotGreaterThan Failure',
    body: n.doc`
    A failure that is returned when the number is not greater than the specified threshold.
    `,
  });

/**
 * Creates a rule that checks if the number is greater than a specified value.
 *
 * @remarks
 * A number is considered valid if it is strictly greater than the specified value.
 * For example, `Gt(5)` will accept numbers like 6, 7, 8, etc., but reject 5.
 * If the number is not greater than the threshold, the rule will return an error
 * Result with code 'Number.NotGreaterThan'.
 *
 * @param threshold - The value that the number must be greater than.
 * @returns A rule function that validates if the number is greater than the threshold.
 *
 * @public
 */
const Gt = rule((threshold: number) =>
  n.assert((value: number) => value > threshold, new NotGreaterThan({ threshold }))
);

n.info(Gt)
  .type('number')
  .params(['threshold', 'number'])
  .doc({
    title: 'Gt',
    body: n.doc`
    A rule that checks if the number is greater than a specified value. A number is considered
    valid if it is strictly greater than the specified value. If the number is not greater than
    the threshold, the rule will return a failure Result with code 'Number.NotGreaterThan'.
    `,
  });

export { Gt, NotGreaterThan };

