/**
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { ok } from '../result';
import { rule, value, ValueRules } from '../schema';
import { type Any } from '../utils';

/**
 * Number constructor rule.
 *
 * @remarks
 * This is only used to create the number constructor rule. It has not validation logic.
 *
 * @internal
 */
const numberConstructor = rule((value: number) => ok(Number(value)))
  .setName('NumberConstructor')
  .setDescription('A value constructor that represents a number')
  .type('number');

/**
 * Creates a number value.
 *
 * @remarks
 * This is a value component that represents a number. It is used to validate and coerce
 * numbers.
 *
 * @typeParam T - The rules to apply to the number value.
 *
 * @param rules - The rules to apply to the number value.
 * @returns A number value component.
 *
 * @public
 */
const number = <R extends ValueRules<number, Any>>(...rules: R) =>
  value(...(rules.length === 0 ? [numberConstructor] : rules))
    .setName('Number')
    .setDescription('A value component that represents a number');

export { number };
