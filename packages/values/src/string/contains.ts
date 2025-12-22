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
 * Not contains failure.
 *
 * @internal
 */
class NotContains extends n.failure(
  'String.NotContains',
  {
    'en-US': 'The string must be one of: {{list | string}}.',
    'es-ES': 'El texto debe ser uno de: {{list | string}}.',
  },
) {}

// Apply metadata to the NotContains failure.
n.info(NotContains)
  .doc({
    title: 'NotContains Failure',
    body: n.doc`
    A failure that is returned when the string is not contained in the allowed list.
    `,
  });

/**
 * Creates a rule that checks if the string is contained in a list.
 *
 * @remarks
 * A string is considered valid if it is contained in the given list. For example,
 * `Contains(['hello', 'world'])` will accept strings that are 'hello' or 'world'.
 * If the string is not in the list, the rule will return an error Result with code 'String.NotContains'.
 *
 * @param list - The list of values to check against.
 * @returns A rule function that validates if the string is in the list.
 *
 * @public
 */
const Contains = rule((list: string[]) =>
  n.assert((value: string) => list.includes(value), new NotContains({ list: list.join(', ') }))
);

n.info(Contains)
  .type('string')
  .params(['list', 'string[]'])
  .doc({
    title: 'Contains',
    body: n.doc`
    A rule that checks if the string is contained in a list. A string is considered valid
    if it is contained in the given list. If the string is not in the list, the rule will
    return a failure Result with code 'String.NotContains'.
    `,
  });

export { Contains, NotContains };
