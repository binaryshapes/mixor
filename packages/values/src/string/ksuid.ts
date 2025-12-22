/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { rule } from '@nuxo/components';
import { n } from '@nuxo/core';

// Regular expression for KSUID validation (from Zod source code).
const ksuidRegex = /^[A-Za-z0-9]{27}$/;

/**
 * Invalid KSUID failure.
 *
 * @internal
 */
class InvalidKsuid extends n.failure(
  'String.InvalidKsuid',
  {
    'en-US': 'The string must be a valid KSUID.',
    'es-ES': 'El texto debe ser un KSUID válido.',
  },
) {}

// Apply metadata to the InvalidKsuid failure.
n.info(InvalidKsuid)
  .doc({
    title: 'InvalidKsuid Failure',
    body: n.doc`
    A failure that is returned when the string is not a valid KSUID.
    `,
  });

/**
 * A rule that checks if the string is a valid KSUID.
 *
 * @remarks
 * A valid KSUID (K-Sortable Unique IDentifier) is a string that contains exactly
 * 27 characters from the set: numbers (0-9), uppercase letters (A-Z), and lowercase
 * letters (a-z). This format is designed to be URL-safe and sortable by timestamp.
 * If the string is not a valid KSUID, the rule will return an error Result with
 * code 'String.InvalidKsuid'.
 *
 * @public
 */
const Ksuid = rule(() => n.assert((value: string) => ksuidRegex.test(value), new InvalidKsuid()));

n.info(Ksuid)
  .type('string')
  .doc({
    title: 'Ksuid',
    body: n.doc`
    A rule that checks if the string is a valid KSUID (K-Sortable Unique IDentifier). A valid
    KSUID is a string that contains exactly 27 characters from the set: numbers (0-9), uppercase
    letters (A-Z), and lowercase letters (a-z). This format is designed to be URL-safe and
    sortable by timestamp. If the string is not a valid KSUID, the rule will return a failure
    Result with code 'String.InvalidKsuid'.
    `,
  });

export { InvalidKsuid, Ksuid };
