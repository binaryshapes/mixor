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
 * Not ends with failure.
 *
 * @internal
 */
class NotEndsWith extends n.failure(
  'String.NotEndsWith',
  {
    'en-US': 'The string must end with {{suffix | string}}.',
    'es-ES': 'El texto debe terminar con {{suffix | string}}.',
  },
) {}

// Apply metadata to the NotEndsWith failure.
n.info(NotEndsWith)
  .doc({
    title: 'NotEndsWith Failure',
    body: n.doc`
    A failure that is returned when the string does not end with the required suffix.
    `,
  });

/**
 * Creates a rule that checks if the string ends with a specific suffix.
 *
 * @remarks
 * A string ends with a suffix if the suffix is found at the end of the string.
 * If the string does not end with the required suffix, the rule will return an error
 * Result with code 'String.NotEndsWith'.
 *
 * @param suffix - The suffix to check for.
 * @returns A rule function that validates if the string ends with the suffix.
 *
 * @public
 */
const EndsWith = rule((suffix: string) =>
  n.assert((value: string) => value.endsWith(suffix), new NotEndsWith({ suffix }))
);

n.info(EndsWith)
  .type('string')
  .params(['suffix', 'string'])
  .doc({
    title: 'EndsWith',
    body: n.doc`
    A rule that checks if the string ends with a specific suffix. A string ends with a suffix
    if the suffix is found at the end of the string. If the string does not end with the
    required suffix, the rule will return a failure Result with code 'String.NotEndsWith'.
    `,
  });

export { EndsWith, NotEndsWith };
