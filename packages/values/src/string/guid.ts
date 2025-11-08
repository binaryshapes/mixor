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
 * A rule that checks if the string is a valid GUID.
 *
 * @remarks
 * A valid GUID (Globally Unique Identifier) is a string that follows the format:
 * xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx where x are hexadecimal characters.
 * This format is identical to UUID and is commonly used in Microsoft systems.
 * If the string is not a valid GUID, the rule will return an error Result with code 'INVALID_GUID'.
 *
 * @public
 */
const Guid = rule(() => n.assert((value: string) => guidRegex.test(value), 'INVALID_GUID'));

n.info(Guid)
  .type('string')
  .doc({
    title: 'Guid',
    body: n.doc`
    A rule that checks if the string is a valid GUID (Globally Unique Identifier). A valid GUID
    is a string that follows the format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx where x are
    hexadecimal characters. This format is identical to UUID and is commonly used in Microsoft
    systems. If the string is not a valid GUID, the rule will return a failure Result with
    code 'INVALID_GUID'.
    `,
  });

export { Guid };
