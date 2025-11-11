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
 * A rule that checks if the value is a string.
 *
 * @remarks
 * This rule has no validation logic. It is only used to create a string value component.
 *
 * @internal
 */
const IsString = rule(() =>
  n.assert((value: string) => typeof value === 'string', 'INVALID_STRING' as never)
);

n.info(IsString)
  .type('string')
  .doc({
    title: 'IsString',
    body: n.doc`
    A rule that checks if the value is a string. If the value is not a string, the rule will
    return the error code 'INVALID_STRING'.
    `,
  });

n.meta(IsString)
  .name('IsString')
  .describe('A rule that checks if the value is a string');

/**
 * Creates a string value.
 *
 * @remarks
 * This is a value component that represents a string with auto type inference.
 *
 * @typeParam E - The type of the error.
 * @param rules - The rules to apply to the string value.
 * @returns A string value component.
 *
 * @public
 */
const string = <E extends string | never = never>(...rules: Validator<string, E>[]) => {
  const stringValue = value<string, E>(
    ...(rules.length === 0 ? [IsString()] : [IsString(), ...rules]),
  );

  // Only set the documentation if it is not already set.
  if (!n.info(stringValue).props.doc) {
    n.info(stringValue)
      .doc({
        title: 'string',
        body: 'A string value is a component that validates a text using one or more rules',
      });
  }

  return stringValue;
};

export { string };
