/**
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { rule, type Validator, value } from '@nuxo/components';
import { n } from '@nuxo/core';

/**
 * A rule that checks if the value is a number.
 *
 * @remarks
 * This rule has no validation logic. It is only used to create a number value component.
 *
 * @internal
 */
const IsNumber = rule(() =>
  n.assert((value: number) => typeof value === 'number', 'INVALID_NUMBER' as never)
);

n.info(IsNumber)
  .type('number')
  .doc({
    title: 'IsNumber',
    body: n.doc`
    A rule that checks if the value is a number. If the value is not a number, the rule will
    return the error code 'INVALID_NUMBER'.
    `,
  });

n.meta(IsNumber)
  .name('IsNumber')
  .describe('A rule that checks if the value is a number');

/**
 * Creates a number value.
 *
 * @remarks
 * This is a value component that represents a number with auto type inference.
 *
 * @typeParam E - The type of the error.
 * @param rules - The rules to apply to the number value.
 * @returns A number value component.
 *
 * @public
 */
const number = <E extends string | never = never>(...rules: Validator<number, E>[]) =>
  value<number, E>(...(rules.length === 0 ? [IsNumber()] : [IsNumber(), ...rules]));

export { number };
