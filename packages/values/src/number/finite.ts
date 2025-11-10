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
 * A rule that checks if the number is finite.
 *
 * @remarks
 * A finite number is any number that is not Infinity, -Infinity, or NaN.
 * This rule rejects infinite values and NaN, accepting only regular numbers.
 * If the number is not finite, the rule will return an error Result with
 * code 'NOT_FINITE'.
 *
 * @public
 */
const Finite = rule(() =>
  n.assert((value: number) => Number.isFinite(value), 'NOT_FINITE')
);

n.info(Finite)
  .type('number')
  .doc({
    title: 'Finite',
    body: n.doc`
    A rule that checks if the number is finite. A finite number is any number that is not
    Infinity, -Infinity, or NaN. This rule rejects infinite values and NaN, accepting only
    regular numbers. If the number is not finite, the rule will return a failure Result with
    code 'NOT_FINITE'.
    `,
  });

export { Finite };

