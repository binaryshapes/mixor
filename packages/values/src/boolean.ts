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
 * A rule that checks if the value is a boolean.
 *
 * @remarks
 * This rule has no validation logic. It is only used to create a boolean value component.
 *
 * @internal
 */
const IsBoolean = rule(() =>
  n.assert((value: boolean) => typeof value === 'boolean', 'INVALID_BOOLEAN' as never)
);

n.info(IsBoolean)
  .type('boolean')
  .doc({
    title: 'IsBoolean',
    body: n.doc`
    A rule that checks if the value is a boolean. If the value is not a boolean, the rule will
    return the error code 'INVALID_BOOLEAN'.
    `,
  });

n.meta(IsBoolean)
  .name('IsBoolean')
  .describe('A rule that checks if the value is a boolean');

/**
 * Creates a boolean value.
 *
 * @remarks
 * This is a value component that represents a boolean with auto type inference.
 *
 * @typeParam E - The type of the error.
 * @param rules - The rules to apply to the boolean value.
 * @returns A boolean value component.
 *
 * @public
 */
const boolean = <E extends string | never = never>(...rules: Validator<boolean, E>[]) => {
  const booleanValue = value<boolean, E>(
    ...(rules.length === 0 ? [IsBoolean()] : [IsBoolean(), ...rules]),
  );

  n.info(booleanValue)
    .doc({
      title: 'boolean',
      body: 'Represents a boolean value',
    });

  return booleanValue;
};

export { boolean };
