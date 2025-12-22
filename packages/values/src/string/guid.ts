/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { rule } from '@nuxo/components';
import { n } from '@nuxo/core';

// Regular expression for GUID validation (from Zod source code).
const guidRegex = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/;

/**
 * Invalid GUID failure.
 *
 * @internal
 */
class InvalidGuid extends n.failure(
  'String.InvalidGuid',
  {
    'en-US': 'The string must be a valid GUID.',
    'es-ES': 'El texto debe ser un GUID válido.',
  },
) {}

// Apply metadata to the InvalidGuid failure.
n.info(InvalidGuid)
  .doc({
    title: 'InvalidGuid Failure',
    body: n.doc`
    A failure that is returned when the string is not a valid GUID.
    `,
  });

/**
 * A rule that checks if the string is a valid GUID.
 *
 * @remarks
 * A valid GUID (Globally Unique Identifier) is a string that follows the format:
 * xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx where x are hexadecimal characters.
 * This format is identical to UUID and is commonly used in Microsoft systems.
 * If the string is not a valid GUID, the rule will return an error Result with code 'String.InvalidGuid'.
 *
 * @public
 */
const Guid = rule(() => n.assert((value: string) => guidRegex.test(value), new InvalidGuid()));

n.info(Guid)
  .type('string')
  .doc({
    title: 'Guid',
    body: n.doc`
    A rule that checks if the string is a valid GUID (Globally Unique Identifier). A valid GUID
    is a string that follows the format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx where x are
    hexadecimal characters. This format is identical to UUID and is commonly used in Microsoft
    systems. If the string is not a valid GUID, the rule will return a failure Result with
    code 'String.InvalidGuid'.
    `,
  });

export { Guid, InvalidGuid };
