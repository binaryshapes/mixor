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
 * Creates a rule that checks if the string contains at least a minimum number of lowercase letters.
 *
 * @remarks
 * A string is considered valid if it contains the given number of lowercase letters. For
 * example, `HasLowercaseLetter(2)` will accept strings that contain at least two
 * lowercase letters. If the string does not contain the required number of lowercase letters,
 * the rule will return an error Result with code 'NOT_LOWERCASE'.
 *
 * @param minCount - Minimum number of lowercase letters to check for (default: 1).
 * @returns A rule function that validates if the string contains the required number of lowercase letters.
 *
 * @public
 */
const HasLowercaseLetter = rule((minCount: number = 1) =>
  n.assert((value: string) => {
    const lowercase = value.match(/[a-z]/g);
    return (!!lowercase?.length && lowercase.length >= minCount);
  }, 'NOT_LOWERCASE')
);

n.info(HasLowercaseLetter)
  .type('string')
  .params(['minCount', 'number'])
  .doc({
    title: 'HasLowercaseLetter',
    body: n.doc`
    A rule that checks if the string contains at least a minimum number of lowercase letters.
    A string is considered valid if it contains the given number of lowercase letters. If the
    string does not contain the required number of lowercase letters, the rule will return a
    failure Result with code 'NOT_LOWERCASE'.
    `,
  });

export { HasLowercaseLetter };
