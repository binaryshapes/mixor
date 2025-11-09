/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { rule } from '@nuxo/components';
import { n } from '@nuxo/core';

// Regular expression for special character validation (from Zod source code).
const specialCharacterRegex = /[!@#$%^&*()_+\-=\\[\]{};':"\\|,.<>\\/?]/;

/**
 * Creates a rule that checks if the string contains at least a minimum number of special characters.
 *
 * @remarks
 * A string is considered valid if it contains the given number of special characters. For
 * example, `HasSpecialCharacter(2)` will accept strings that contain at least two
 * special characters. If the string does not contain the required number of special characters,
 * the rule will return an error Result with code 'NOT_SPECIAL_CHARACTER'.
 *
 * @param minCount - Minimum number of special characters to check for (default: 1).
 * @returns A rule function that validates if the string contains the required number of special characters.
 *
 * @public
 */
const HasSpecialCharacter = rule((minCount: number = 1) =>
  n.assert((value: string) => {
    const special = value.match(specialCharacterRegex);
    return (!!special?.length && special.length >= minCount);
  }, 'NOT_SPECIAL_CHARACTER')
);

n.info(HasSpecialCharacter)
  .type('string')
  .params(['minCount', 'number'])
  .doc({
    title: 'HasSpecialCharacter',
    body: n.doc`
    A rule that checks if the string contains at least a minimum number of special characters.
    A string is considered valid if it contains the given number of special characters. If the
    string does not contain the required number of special characters, the rule will return a
    failure Result with code 'NOT_SPECIAL_CHARACTER'.
    `,
  });

export { HasSpecialCharacter };
