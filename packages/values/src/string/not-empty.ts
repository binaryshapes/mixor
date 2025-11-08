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
 * A rule that checks if the string is not empty.
 *
 * @remarks
 * This rule trims the string before validating. If the string is empty, the rule will
 * return a error Result with code 'EMPTY_STRING'.
 *
 * @public
 */
const NotEmpty = rule(() => n.assert((value: string) => value.trim().length > 0, 'EMPTY_STRING'));

n.info(NotEmpty)
  .type('string')
  .doc({
    title: 'NotEmpty',
    body: n.doc`
    A rule that checks if the string is not empty. It trims the string before validating.
    If the string is empty, the rule will return a failure Result with code 'EMPTY_STRING'.
    `,
  });

export { NotEmpty };
