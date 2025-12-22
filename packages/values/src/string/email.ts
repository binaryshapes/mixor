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
 * Email patterns taken from Zod source code.
 *
 * @internal
 */
const emailPattern = {
  common:
    /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9-]*\.)+[A-Za-z]{2,}$/,

  /** Equivalent to the HTML5 input[type=email] validation implemented by browsers */
  html5Email:
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,

  /** The classic https://emailregex.com/ regex for RFC 5322-compliant emails */
  rfc5322Email:
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,

  /** A loose regex that allows Unicode characters, enforces length limits */
  unicodeEmail: /^[^\s@"]{1,64}@[^\s@"]{1,255}$/u,

  browserEmail:
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
};

/**
 * Invalid email failure.
 *
 * @internal
 */
class InvalidEmail extends n.failure(
  'String.InvalidEmail',
  {
    'en-US': 'The string must be a valid email address.',
    'es-ES': 'El texto debe ser una dirección de correo electrónico válida.',
  },
) {}

// Apply metadata to the InvalidEmail failure.
n.info(InvalidEmail)
  .doc({
    title: 'InvalidEmail Failure',
    body: n.doc`
    A failure that is returned when the string is not a valid email address.
    `,
  });

/**
 * Creates a rule that validates that the value is a valid email address.
 *
 * @remarks
 * This rule supports multiple email validation patterns:
 * - `common`: Standard email validation (default)
 * - `html5Email`: HTML5 input[type=email] validation
 * - `rfc5322Email`: RFC 5322-compliant email validation
 * - `unicodeEmail`: Unicode-aware email validation with length limits
 * - `browserEmail`: Browser-compatible email validation
 *
 * If the string is not a valid email address, the rule will return an error Result with
 * code 'String.InvalidEmail'.
 *
 * @param type - The type of email pattern to use. Defaults to 'common'.
 * @returns A rule that validates email addresses.
 *
 * @public
 */
const Email = rule((type: keyof typeof emailPattern = 'common') =>
  n.assert((value: string) => emailPattern[type].test(value), new InvalidEmail())
);

n.info(Email)
  .type('string')
  .params(['type', '"common" | "html5Email" | "rfc5322Email" | "unicodeEmail" | "browserEmail"'])
  .doc({
    title: 'Email',
    body: n.doc`
    A rule that validates that the value is a valid email address. This rule supports multiple
    email validation patterns: 'common' (default), 'html5Email', 'rfc5322Email', 'unicodeEmail',
    and 'browserEmail'. If the string is not a valid email address, the rule will return a
    failure Result with code 'String.InvalidEmail'.
    `,
  });

export { Email, InvalidEmail };
