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
 * Not starts with failure.
 *
 * @internal
 */
class NotStartsWith extends n.failure(
  'String.NotStartsWith',
  {
    'en-US': 'The string must start with {{prefix | string}}.',
    'es-ES': 'El texto debe comenzar con {{prefix | string}}.',
  },
) {}

// Apply metadata to the NotStartsWith failure.
n.info(NotStartsWith)
  .doc({
    title: 'NotStartsWith Failure',
    body: n.doc`
    A failure that is returned when the string does not start with the required prefix.
    `,
  });

/**
 * Creates a rule that checks if the string starts with a specific prefix.
 *
 * @remarks
 * A string is considered valid if it begins with the specified prefix. If the string
 * does not start with the required prefix, the rule will return an error Result with
 * code 'String.NotStartsWith'.
 *
 * @param prefix - The prefix to check for.
 * @returns A rule function that validates if the string starts with the prefix.
 *
 * @public
 */
const StartsWith = rule((prefix: string) =>
  n.assert((value: string) => value.startsWith(prefix), new NotStartsWith({ prefix }))
);

n.info(StartsWith)
  .type('string')
  .params(['prefix', 'string'])
  .doc({
    title: 'StartsWith',
    body: n.doc`
    A rule that checks if the string starts with a specific prefix. A string is considered
    valid if it begins with the specified prefix. If the string does not start with the
    required prefix, the rule will return a failure Result with code 'String.NotStartsWith'.
    `,
  });

export { StartsWith, NotStartsWith };
