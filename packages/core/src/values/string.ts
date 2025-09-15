/**
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { ok } from '../result';
import { type Rule, type ValueConstructor, rule, value } from '../schema';
import { type Any } from '../utils';

/**
 * String constructor rule.
 *
 * @remarks
 * This is only used to create the string constructor rule. It has not validation logic.
 *
 * @internal
 */
const stringConstructor = rule((value: string) => ok(value))
  .setName('StringConstructor')
  .setDescription('A value constructor that represents a string')
  .type('string');

/**
 * Creates a string value.
 *
 * @remarks
 * This is a value component that represents a string. It is used to validate and coerce
 * strings.
 *
 * @typeParam T - The rules to apply to the string value.
 *
 * @param rules - The rules to apply to the string value.
 * @returns A string value component.
 *
 * @public
 */
const string = ((...rules: Rule<string, Any>[]) =>
  value(...(rules.length === 0 ? [stringConstructor] : rules))
    .setName('String')
    .setDescription('A value component that represents a string')) as ValueConstructor<string>;

export { string };
