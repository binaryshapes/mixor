/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { rule } from '@nuxo/components';
import { n } from '@nuxo/core';

// Regular expression for ISO time validation.
// https://github.com/colinhacks/zod/blob/0313553db1bca4a023ff4767503befc025689188/packages/zod/src/v4/core/regexes.ts#L95
const timeRegex = new RegExp(
  /(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?::[0-5]\\d(?:\\.\\d+)?)?/,
);

/**
 * Invalid ISO time failure.
 *
 * @internal
 */
class InvalidIsoTime extends n.failure(
  'String.InvalidIsoTime',
  {
    'en-US': 'The string must be a valid ISO time.',
    'es-ES': 'El texto debe ser una hora ISO válida.',
  },
) {}

// Apply metadata to the InvalidIsoTime failure.
n.info(InvalidIsoTime)
  .doc({
    title: 'InvalidIsoTime Failure',
    body: n.doc`
    A failure that is returned when the string is not a valid ISO time.
    `,
  });

/**
 * A rule that checks if the string is a valid ISO time.
 *
 * @remarks
 * A valid ISO time string follows the format HH:MM:SS (e.g., "12:34:56").
 * Strings that don't match this format are rejected. If the string is not a valid ISO time,
 * the rule will return an error Result with code 'String.InvalidIsoTime'.
 *
 * @public
 */
const IsoTime = rule(() => n.assert((value: string) => timeRegex.test(value), new InvalidIsoTime()));

n.info(IsoTime)
  .type('string')
  .doc({
    title: 'IsoTime',
    body: n.doc`
    A rule that checks if the string is a valid ISO time. A valid ISO time string follows
    the format HH:MM:SS (e.g., "12:34:56"). Strings that don't match this format are rejected.
    If the string is not a valid ISO time, the rule will return a failure Result with code
    'String.InvalidIsoTime'.
    `,
  });

export { InvalidIsoTime, IsoTime };
