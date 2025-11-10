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
 * Creates a rule that checks if the string starts with a specific prefix.
 *
 * @remarks
 * A string is considered valid if it begins with the specified prefix. If the string
 * does not start with the required prefix, the rule will return an error Result with
 * code 'NOT_STARTS_WITH'.
 *
 * @param prefix - The prefix to check for.
 * @returns A rule function that validates if the string starts with the prefix.
 *
 * @public
 */
const StartsWith = rule((prefix: string) =>
  n.assert((value: string) => value.startsWith(prefix), 'NOT_STARTS_WITH')
);

n.info(StartsWith)
  .type('string')
  .params(['prefix', 'string'])
  .doc({
    title: 'StartsWith',
    body: n.doc`
    A rule that checks if the string starts with a specific prefix. A string is considered
    valid if it begins with the specified prefix. If the string does not start with the
    required prefix, the rule will return a failure Result with code 'NOT_STARTS_WITH'.
    `,
  });

export { StartsWith };
