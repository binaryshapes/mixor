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
 * Not less than or equal failure.
 *
 * @internal
 */
class NotLessThanOrEqual extends n.failure(
  'Number.NotLessThanOrEqual',
  {
    'en-US': 'The number must be less than or equal to {{threshold | number}}.',
    'es-ES': 'El número debe ser menor o igual que {{threshold | number}}.',
  },
) {}

// Apply metadata to the NotLessThanOrEqual failure.
n.info(NotLessThanOrEqual)
  .doc({
    title: 'NotLessThanOrEqual Failure',
    body: n.doc`
    A failure that is returned when the number is not less than or equal to the specified threshold.
    `,
  });

/**
 * Creates a rule that checks if the number is less than or equal to a specified value.
 *
 * @remarks
 * A number is considered valid if it is less than or equal to the specified value.
 * For example, `Lte(10)` will accept numbers like 8, 9, 10, etc.
 * If the number is not less than or equal to the threshold, the rule will return
 * an error Result with code 'Number.NotLessThanOrEqual'.
 *
 * @param threshold - The value that the number must be less than or equal to.
 * @returns A rule function that validates if the number is less than or equal to the threshold.
 *
 * @public
 */
const Lte = rule((threshold: number) =>
  n.assert((value: number) => value <= threshold, new NotLessThanOrEqual({ threshold }))
);

n.info(Lte)
  .type('number')
  .params(['threshold', 'number'])
  .doc({
    title: 'Lte',
    body: n.doc`
    A rule that checks if the number is less than or equal to a specified value. A number is
    considered valid if it is less than or equal to the specified value. If the number is not
    less than or equal to the threshold, the rule will return a failure Result with code
    'Number.NotLessThanOrEqual'.
    `,
  });

export { Lte, NotLessThanOrEqual };

