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
 * Not digit failure.
 *
 * @internal
 */
class NotDigit extends n.failure(
  'String.NotDigit',
  {
    'en-US': 'The string must contain at least {{min | number}} digit(s).',
    'es-ES': 'El texto debe contener al menos {{min | number}} dígito(s).',
  },
) {}

// Apply metadata to the NotDigit failure.
n.info(NotDigit)
  .doc({
    title: 'NotDigit Failure',
    body: n.doc`
    A failure that is returned when the string does not contain the required number of digits.
    `,
  });

/**
 * Creates a rule that checks if the string contains at least a minimum number of digits.
 *
 * @remarks
 * A string is considered valid if it contains the given number of digits. For example,
 * `HasDigit(2)` will accept strings that contain at least two digits. If the string does
 * not contain the required number of digits, the rule will return an error Result with
 * code 'String.NotDigit'.
 *
 * @param minCount - Minimum number of digits to check for (default: 1).
 * @returns A rule function that validates if the string contains the required number of digits.
 *
 * @public
 */
const HasDigit = rule((minCount: number = 1) =>
  n.assert((value: string) => {
    const digits = value.match(/\d/g);
    return (!!digits?.length && digits.length >= minCount);
  }, new NotDigit({ min: minCount }))
);

n.info(HasDigit)
  .type('string')
  .params(['minCount', 'number'])
  .doc({
    title: 'HasDigit',
    body: n.doc`
    A rule that checks if the string contains at least a minimum number of digits. A string
    is considered valid if it contains the given number of digits. If the string does not
    contain the required number of digits, the rule will return a failure Result with
    code 'String.NotDigit'.
    `,
  });

export { HasDigit, NotDigit };
