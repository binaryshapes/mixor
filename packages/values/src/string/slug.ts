/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { rule } from '@nuxo/components';
import { n } from '@nuxo/core';

// Regular expression for slug validation (from Zod source code).
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * A rule that checks if the string is a valid slug.
 *
 * @remarks
 * A valid slug contains only lowercase letters, numbers, and hyphens. It must start
 * and end with alphanumeric characters and cannot have consecutive hyphens.
 * If the string is not a valid slug, the rule will return an error Result with
 * code 'INVALID_SLUG'.
 *
 * @public
 */
const Slug = rule(() => n.assert((value: string) => slugRegex.test(value), 'INVALID_SLUG'));

n.info(Slug)
  .type('string')
  .doc({
    title: 'Slug',
    body: n.doc`
    A rule that checks if the string is a valid slug. A valid slug contains only lowercase
    letters, numbers, and hyphens. It must start and end with alphanumeric characters and
    cannot have consecutive hyphens. If the string is not a valid slug, the rule will
    return a failure Result with code 'INVALID_SLUG'.
    `,
  });

export { Slug };
