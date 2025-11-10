/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { rule } from '@nuxo/components';
import { n } from '@nuxo/core';

// Regular expression for RGB validation (from Zod source code).
const rgbRegex = /^rgb?\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/;

/**
 * A rule that checks if the string is a valid RGB color.
 *
 * @remarks
 * A valid RGB color string follows the format `rgb(r, g, b)` where `r`, `g`, and `b`
 * are numbers between 0 and 255. If the string is not a valid RGB color, the rule
 * will return an error Result with code 'INVALID_RGB'.
 *
 * @public
 */
const Rgb = rule(() => n.assert((value: string) => rgbRegex.test(value), 'INVALID_RGB'));

n.info(Rgb)
  .type('string')
  .doc({
    title: 'Rgb',
    body: n.doc`
    A rule that checks if the string is a valid RGB color. A valid RGB color string follows
    the format rgb(r, g, b) where r, g, and b are numbers between 0 and 255. If the string
    is not a valid RGB color, the rule will return a failure Result with code 'INVALID_RGB'.
    `,
  });

export { Rgb };
