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
 * Not uppercase letter failure.
 *
 * @internal
 */
class NotUppercaseLetter extends n.failure(
  'String.NotUppercaseLetter',
  {
    'en-US': 'The string must contain at least {{min | number}} uppercase letter(s).',
    'es-ES': 'El texto debe contener al menos {{min | number}} letra(s) mayúscula(s).',
  },
) {}

// Apply metadata to the NotUppercaseLetter failure.
n.info(NotUppercaseLetter)
  .doc({
    title: 'NotUppercaseLetter Failure',
    body: n.doc`
    A failure that is returned when the string does not contain the required number of uppercase letters.
    `,
  });

/**
 * Creates a rule that checks if the string contains at least a minimum number of uppercase letters.
 *
 * @remarks
 * A string is considered valid if it contains the given number of uppercase letters. For
 * example, `HasUppercaseLetter(2)` will accept strings that contain at least two
 * uppercase letters. If the string does not contain the required number of uppercase letters,
 * the rule will return an error Result with code 'String.NotUppercaseLetter'.
 *
 * @param minCount - Minimum number of uppercase letters to check for (default: 1).
 * @returns A rule function that validates if the string contains the required number of uppercase letters.
 *
 * @public
 */
const HasUppercaseLetter = rule((minCount: number = 1) =>
  n.assert((value: string) => {
    const uppercase = value.match(/[A-Z]/g);
    return (!!uppercase?.length && uppercase.length >= minCount);
  }, new NotUppercaseLetter({ min: minCount }))
);

n.info(HasUppercaseLetter)
  .type('string')
  .params(['minCount', 'number'])
  .doc({
    title: 'HasUppercaseLetter',
    body: n.doc`
    A rule that checks if the string contains at least a minimum number of uppercase letters.
    A string is considered valid if it contains the given number of uppercase letters. If the
    string does not contain the required number of uppercase letters, the rule will return a
    failure Result with code 'String.NotUppercaseLetter'.
    `,
  });

export { HasUppercaseLetter, NotUppercaseLetter };
