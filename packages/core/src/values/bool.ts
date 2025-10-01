/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ok } from '../result';
import { rule, value } from '../schema';

/**
 * Boolean constructor rule.
 *
 * @remarks
 * This is only used to create the boolean constructor rule. It has not validation logic.
 *
 * @internal
 */
const boolConstructor = rule((value: boolean) => ok(Boolean(value)))
  .setName('BoolConstructor')
  .setDescription('A value constructor that represents a boolean')
  .type('boolean');

/**
 * Creates a boolean value.
 *
 * @remarks
 * This is a value component that represents a boolean. It is used to validate and coerce
 * booleans.
 *
 * @returns A boolean value.
 *
 * @public
 */
const bool = () =>
  value(boolConstructor)
    .setName('Bool')
    .setDescription('A value component that represents a boolean')
    .type('boolean');

export { bool };
