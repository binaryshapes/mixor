/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { rule } from '@nuxo/components';
import { n } from '@nuxo/core';

// Regular expression for RGBA validation (from Zod source code).
const rgbaRegex = /^rgba?\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3}),\s*([01]|0\.\d+)\)$/;

/**
 * Invalid RGBA failure.
 *
 * @internal
 */
class InvalidRgba extends n.failure(
  'String.InvalidRgba',
  {
    'en-US': 'The string must be a valid RGBA color.',
    'es-ES': 'El texto debe ser un color RGBA válido.',
  },
) {}

// Apply metadata to the InvalidRgba failure.
n.info(InvalidRgba)
  .doc({
    title: 'InvalidRgba Failure',
    body: n.doc`
    A failure that is returned when the string is not a valid RGBA color.
    `,
  });

/**
 * A rule that checks if the string is a valid RGBA color.
 *
 * @remarks
 * A valid RGBA color string follows the format `rgba(r, g, b, a)` where `r`, `g`, `b`
 * are numbers between 0 and 255, and `a` is the alpha channel between 0 and 1.
 * If the string is not a valid RGBA color, the rule will return an error Result with
 * code 'String.InvalidRgba'.
 *
 * @public
 */
const Rgba = rule(() => n.assert((value: string) => rgbaRegex.test(value), new InvalidRgba()));

n.info(Rgba)
  .type('string')
  .doc({
    title: 'Rgba',
    body: n.doc`
    A rule that checks if the string is a valid RGBA color. A valid RGBA color string follows
    the format rgba(r, g, b, a) where r, g, b are numbers between 0 and 255, and a is the
    alpha channel between 0 and 1. If the string is not a valid RGBA color, the rule will
    return a failure Result with code 'String.InvalidRgba'.
    `,
  });

export { InvalidRgba, Rgba };
