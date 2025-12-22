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
 * Not integer failure.
 *
 * @internal
 */
class NotInteger extends n.failure(
  'Number.NotInteger',
  {
    'en-US': 'The number must be an integer.',
    'es-ES': 'El número debe ser un entero.',
  },
) {}

// Apply metadata to the NotInteger failure.
n.info(NotInteger)
  .doc({
    title: 'NotInteger Failure',
    body: n.doc`
    A failure that is returned when the number is not an integer.
    `,
  });

/**
 * A rule that checks if the number is an integer.
 *
 * @remarks
 * An integer is any number that has no fractional part (no decimal places).
 * This rule accepts whole numbers like 1, 2, -3, 0, etc., rejecting
 * decimal numbers like 1.5, 2.7, etc. If the number is not an integer,
 * the rule will return an error Result with code 'Number.NotInteger'.
 *
 * @public
 */
const Int = rule(() =>
  n.assert((value: number) => Number.isInteger(value), new NotInteger())
);

n.info(Int)
  .type('number')
  .doc({
    title: 'Int',
    body: n.doc`
    A rule that checks if the number is an integer. An integer is any number that has no
    fractional part (no decimal places). This rule accepts whole numbers like 1, 2, -3, 0,
    etc., rejecting decimal numbers like 1.5, 2.7, etc. If the number is not an integer,
    the rule will return a failure Result with code 'Number.NotInteger'.
    `,
  });

export { Int, NotInteger };

