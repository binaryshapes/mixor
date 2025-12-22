/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { rule } from '@nuxo/components';
import { n } from '@nuxo/core';

// Regular expression for ISO date validation.
// https://regexlib.com/REDetails.aspx?regexp_id=3344
// https://stackoverflow.com/a/7221570
const dateRegex = new RegExp(
  /^(?:(?=[02468][048]00|[13579][26]00|[0-9][0-9]0[48]|[0-9][0-9][2468][048]|[0-9][0-9][13579][26])\d{4}(?:(-|)(?:(?:00[1-9]|0[1-9][0-9]|[1-2][0-9][0-9]|3[0-5][0-9]|36[0-6])|(?:01|03|05|07|08|10|12)(?:\1(?:0[1-9]|[12][0-9]|3[01]))?|(?:04|06|09|11)(?:\1(?:0[1-9]|[12][0-9]|30))?|02(?:\1(?:0[1-9]|[12][0-9]))?|W(?:0[1-9]|[1-4][0-9]|5[0-3])(?:\1[1-7])?))?)$|^(?:(?![02468][048]00|[13579][26]00|[0-9][0-9]0[48]|[0-9][0-9][2468][048]|[0-9][0-9][13579][26])\d{4}(?:(-|)(?:(?:00[1-9]|0[1-9][0-9]|[1-2][0-9][0-9]|3[0-5][0-9]|36[0-5])|(?:01|03|05|07|08|10|12)(?:\2(?:0[1-9]|[12][0-9]|3[01]))?|(?:04|06|09|11)(?:\2(?:0[1-9]|[12][0-9]|30))?|(?:02)(?:\2(?:0[1-9]|1[0-9]|2[0-8]))?|W(?:0[1-9]|[1-4][0-9]|5[0-3])(?:\2[1-7])?))?)$/,
);

/**
 * Invalid ISO date failure.
 *
 * @internal
 */
class InvalidIsoDate extends n.failure(
  'String.InvalidIsoDate',
  {
    'en-US': 'The string must be a valid ISO date.',
    'es-ES': 'El texto debe ser una fecha ISO válida.',
  },
) {}

// Apply metadata to the InvalidIsoDate failure.
n.info(InvalidIsoDate)
  .doc({
    title: 'InvalidIsoDate Failure',
    body: n.doc`
    A failure that is returned when the string is not a valid ISO date.
    `,
  });

/**
 * A rule that checks if the string is a valid ISO date.
 *
 * @remarks
 * A valid ISO date string follows the format YYYY-MM-DD (e.g., "2021-01-01").
 * Strings that don't match this format or represent invalid dates are rejected.
 * If the string is not a valid ISO date, the rule will return an error Result with
 * code 'String.InvalidIsoDate'.
 *
 * @public
 */
const IsoDate = rule(() => n.assert((value: string) => dateRegex.test(value), new InvalidIsoDate()));

n.info(IsoDate)
  .type('string')
  .doc({
    title: 'IsoDate',
    body: n.doc`
    A rule that checks if the string is a valid ISO date. A valid ISO date string follows
    the format YYYY-MM-DD (e.g., "2021-01-01"). Strings that don't match this format or
    represent invalid dates are rejected. If the string is not a valid ISO date, the rule
    will return a failure Result with code 'String.InvalidIsoDate'.
    `,
  });

export { dateRegex, InvalidIsoDate, IsoDate };
