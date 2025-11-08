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
 * Creates a rule that checks if the string is contained in a list.
 *
 * @remarks
 * A string is considered valid if it is contained in the given list. For example,
 * `Contains(['hello', 'world'])` will accept strings that are 'hello' or 'world'.
 * If the string is not in the list, the rule will return an error Result with code 'NOT_CONTAINS'.
 *
 * @param list - The list of values to check against.
 * @returns A rule function that validates if the string is in the list.
 *
 * @public
 */
const Contains = rule((list: string[]) =>
  n.assert((value: string) => list.includes(value), 'NOT_CONTAINS')
);

n.info(Contains)
  .type('string')
  .params(['list', 'string[]'])
  .doc({
    title: 'Contains',
    body: n.doc`
    A rule that checks if the string is contained in a list. A string is considered valid
    if it is contained in the given list. If the string is not in the list, the rule will
    return a failure Result with code 'NOT_CONTAINS'.
    `,
  });

export { Contains };
