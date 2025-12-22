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
 * String not match failure.
 *
 * @internal
 */
class StringNotMatch extends n.failure(
  'String.StringNotMatch',
  {
    'en-US': 'The string must match the required pattern.',
    'es-ES': 'El texto debe coincidir con el patrón requerido.',
  },
) {}

// Apply metadata to the StringNotMatch failure.
n.info(StringNotMatch)
  .doc({
    title: 'StringNotMatch Failure',
    body: n.doc`
    A failure that is returned when the string does not match the required pattern.
    `,
  });

/**
 * Creates a rule that checks if the string matches a regular expression pattern.
 *
 * @remarks
 * A string is considered valid if it matches the given regular expression pattern.
 * For example, `Matches(/^[a-z]+$/)` will accept strings that contain only
 * lowercase letters. If the string does not match the pattern, the rule will return
 * an error Result with code 'String.StringNotMatch'.
 *
 * @param pattern - The regular expression to match.
 * @returns A rule function that validates if the string matches the pattern.
 *
 * @public
 */
const Matches = rule((pattern: RegExp) =>
  n.assert((value: string) => pattern.test(value), new StringNotMatch())
);

n.info(Matches)
  .type('string')
  .params(['pattern', 'RegExp'])
  .doc({
    title: 'Matches',
    body: n.doc`
    A rule that checks if the string matches a regular expression pattern. A string is
    considered valid if it matches the given regular expression pattern. If the string
    does not match the pattern, the rule will return a failure Result with code
    'String.StringNotMatch'.
    `,
  });

export { Matches, StringNotMatch };
