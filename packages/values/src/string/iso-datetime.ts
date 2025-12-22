/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { rule } from '@nuxo/components';
import { n } from '@nuxo/core';

import { dateRegex } from './iso-date.ts';

// Regular expression for ISO date time validation.
// https://github.com/honeinc/is-iso-date
const datetimeRegex = new RegExp(
  /(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))/,
);

/**
 * Invalid ISO datetime failure.
 *
 * @internal
 */
class InvalidIsoDatetime extends n.failure(
  'String.InvalidIsoDatetime',
  {
    'en-US': 'The string must be a valid ISO date and time.',
    'es-ES': 'El texto debe ser una fecha y hora ISO válida.',
  },
) {}

// Apply metadata to the InvalidIsoDatetime failure.
n.info(InvalidIsoDatetime)
  .doc({
    title: 'InvalidIsoDatetime Failure',
    body: n.doc`
    A failure that is returned when the string is not a valid ISO date and time.
    `,
  });

/**
 * A rule that checks if the string is a valid ISO date and time.
 *
 * @remarks
 * A valid ISO date time string follows the format YYYY-MM-DDTHH:MM:SSZ (e.g., "2021-01-01T12:34:56Z").
 * It can include milliseconds and timezone information. Strings that don't match this format
 * are rejected. If the string is not a valid ISO date and time, the rule will return an error
 * Result with code 'String.InvalidIsoDatetime'.
 *
 * @public
 */
const IsoDatetime = rule(() =>
  n.assert(
    (value: string) => datetimeRegex.test(value) && dateRegex.test(value.split('T')[0]),
    new InvalidIsoDatetime(),
  )
);

n.info(IsoDatetime)
  .type('string')
  .doc({
    title: 'IsoDatetime',
    body: n.doc`
    A rule that checks if the string is a valid ISO date and time. A valid ISO date time string
    follows the format YYYY-MM-DDTHH:MM:SS (e.g., "2021-01-01T12:34:56"). It can include
    milliseconds and timezone information. Strings that don't match this format are rejected.
    If the string is not a valid ISO date and time, the rule will return a failure Result with
    code 'String.InvalidIsoDatetime'.
    `,
  });

export { InvalidIsoDatetime, IsoDatetime };
