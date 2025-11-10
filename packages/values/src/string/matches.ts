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
 * Creates a rule that checks if the string matches a regular expression pattern.
 *
 * @remarks
 * A string is considered valid if it matches the given regular expression pattern.
 * For example, `Matches(/^[a-z]+$/)` will accept strings that contain only
 * lowercase letters. If the string does not match the pattern, the rule will return
 * an error Result with code 'STRING_NOT_MATCH'.
 *
 * @param pattern - The regular expression to match.
 * @returns A rule function that validates if the string matches the pattern.
 *
 * @public
 */
const Matches = rule((pattern: RegExp) =>
  n.assert((value: string) => pattern.test(value), 'STRING_NOT_MATCH')
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
    'STRING_NOT_MATCH'.
    `,
  });

export { Matches };
