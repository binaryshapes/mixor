/**
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { ok } from '../result';
import { rule, value } from '../schema';

/**
 * String constructor rule.
 *
 * @remarks
 * This is only used to create the string constructor rule. It has not validation logic.
 *
 * @internal
 */
const stringConstructor = rule((value: string) => ok(value))
  .type('string')
  .setName('StringConstructor')
  .setDescription('A value constructor that represents a string');

/**
 * Creates a string value.
 *
 * @remarks
 * This is a value component that represents a string. It is used to validate and coerce
 * strings.
 *
 * @returns A string value component.
 *
 * @public
 */
const string = () =>
  value(stringConstructor)
    .setName('String')
    .setDescription('A value component that represents a string');

export { string };
