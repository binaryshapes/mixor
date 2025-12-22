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
 * Not less than failure.
 *
 * @internal
 */
class NotLessThan extends n.failure(
  'Number.NotLessThan',
  {
    'en-US': 'The number must be less than {{threshold | number}}.',
    'es-ES': 'El número debe ser menor que {{threshold | number}}.',
  },
) {}

// Apply metadata to the NotLessThan failure.
n.info(NotLessThan)
  .doc({
    title: 'NotLessThan Failure',
    body: n.doc`
    A failure that is returned when the number is not less than the specified threshold.
    `,
  });

/**
 * Creates a rule that checks if the number is less than a specified value.
 *
 * @remarks
 * A number is considered valid if it is strictly less than the specified value.
 * For example, `Lt(10)` will accept numbers like 8, 9, etc., but reject 10.
 * If the number is not less than the threshold, the rule will return an error
 * Result with code 'Number.NotLessThan'.
 *
 * @param threshold - The value that the number must be less than.
 * @returns A rule function that validates if the number is less than the threshold.
 *
 * @public
 */
const Lt = rule((threshold: number) =>
  n.assert((value: number) => value < threshold, new NotLessThan({ threshold }))
);

n.info(Lt)
  .type('number')
  .params(['threshold', 'number'])
  .doc({
    title: 'Lt',
    body: n.doc`
    A rule that checks if the number is less than a specified value. A number is considered
    valid if it is strictly less than the specified value. If the number is not less than the
    threshold, the rule will return a failure Result with code 'Number.NotLessThan'.
    `,
  });

export { Lt, NotLessThan };

