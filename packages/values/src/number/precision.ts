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
 * Too many decimals failure.
 *
 * @internal
 */
class TooManyDecimals extends n.failure(
  'Number.TooManyDecimals',
  {
    'en-US': 'The number must have at most {{max | number}} decimal places.',
    'es-ES': 'El número debe tener como máximo {{max | number}} decimales.',
  },
) {}

// Apply metadata to the TooManyDecimals failure.
n.info(TooManyDecimals)
  .doc({
    title: 'TooManyDecimals Failure',
    body: n.doc`
    A failure that is returned when the number has too many decimal places.
    `,
  });

/**
 * Creates a rule that checks if the number has a limited number of decimal places.
 *
 * @remarks
 * This rule validates that a number has no more than the specified number of decimal places.
 * For example, `Precision(2)` will accept numbers like 1.23, 45.6, 7, etc., but reject
 * numbers like 1.234, 45.678, etc. If the number has too many decimal places, the rule
 * will return an error Result with code 'Number.TooManyDecimals'.
 *
 * @param maxDecimals - The maximum number of decimal places allowed.
 * @returns A rule function that validates if the number has the required precision.
 *
 * @public
 */
const Precision = rule((maxDecimals: number) =>
  n.assert((value: number) => {
    const decimalPlaces = (value.toString().split('.')[1] || '').length;
    return decimalPlaces <= maxDecimals;
  }, new TooManyDecimals({ max: maxDecimals }))
);

n.info(Precision)
  .type('number')
  .params(['maxDecimals', 'number'])
  .doc({
    title: 'Precision',
    body: n.doc`
    A rule that checks if the number has a limited number of decimal places. This rule validates
    that a number has no more than the specified number of decimal places. If the number has too
    many decimal places, the rule will return a failure Result with code 'Number.TooManyDecimals'.
    `,
  });

export { Precision, TooManyDecimals };

