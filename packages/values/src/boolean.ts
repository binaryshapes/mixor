/**
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { rule, type Validator, type Value, value } from '@nuxo/components';
import { n } from '@nuxo/core';

import type { ValidatorsErrorTypes } from './types.ts';

/**
 * Invalid boolean failure.
 *
 * @internal
 */
class InvalidBoolean extends n.failure(
  'Boolean.InvalidBoolean',
  {
    'en-US': 'The value must be a boolean.',
    'es-ES': 'El valor debe ser un booleano.',
  },
) {}

// Apply metadata to the InvalidBoolean failure.
n.info(InvalidBoolean)
  .doc({
    title: 'InvalidBoolean Failure',
    body: n.doc`
    A failure that is returned when the value is not a boolean.
    `,
  });

/**
 * A rule that checks if the value is a boolean.
 *
 * @remarks
 * This rule has no validation logic. It is only used to create a boolean value component.
 *
 * @internal
 */
const IsBoolean = rule(() =>
  n.assert((value: boolean) => typeof value === 'boolean', new InvalidBoolean() as never)
);

n.info(IsBoolean)
  .type('boolean')
  .doc({
    title: 'IsBoolean',
    body: n.doc`
    A rule that checks if the value is a boolean. If the value is not a boolean, the rule will
    return the error code 'Boolean.InvalidBoolean'.
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
 * @param rules - The rules to apply to the boolean value.
 * @returns A boolean value component.
 *
 * @public
 */
function boolean<V extends readonly Validator<boolean, n.Any>[]>(
  ...rules: V
): Value<boolean, ValidatorsErrorTypes<V>, true> {
  const booleanValue = value<boolean, ValidatorsErrorTypes<V>>(
    ...(rules.length === 0 ? [IsBoolean()] : [IsBoolean(), ...rules]),
  );

  // Only set the documentation if it is not already set.
  if (!n.info(booleanValue).props.doc) {
    n.info(booleanValue)
      .doc({
        title: 'boolean',
        body: 'A boolean value is a component that validates a boolean using one or more rules',
      });
  }

  return booleanValue;
}

export { boolean };
