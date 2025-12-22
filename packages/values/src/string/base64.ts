/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { rule } from '@nuxo/components';
import { n } from '@nuxo/core';

// Regular expression for base64 validation (from Zod source code).
const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/;

/**
 * Not base64 failure.
 *
 * @internal
 */
class NotBase64 extends n.failure(
  'String.NotBase64',
  {
    'en-US': 'The string must be a valid base64 string.',
    'es-ES': 'El texto debe ser una cadena base64 válida.',
  },
) {}

// Apply metadata to the NotBase64 failure.
n.info(NotBase64)
  .doc({
    title: 'NotBase64 Failure',
    body: n.doc`
    A failure that is returned when the string is not a valid base64 string.
    `,
  });

/**
 * A rule that checks if the string is a valid base64 string.
 *
 * @remarks
 * A valid base64 string contains only base64 characters (A-Z, a-z, 0-9, +, /, =).
 * Strings that don't match this format are rejected. If the string is not a valid
 * base64 string, the rule will return an error Result with code 'String.NotBase64'.
 *
 * @public
 */
const Base64 = rule(() => n.assert((value: string) => base64Regex.test(value), new NotBase64()));

n.info(Base64)
  .type('string')
  .doc({
    title: 'Base64',
    body: n.doc`
    A rule that checks if the string is a valid base64 string. A valid base64 string
    contains only base64 characters (A-Z, a-z, 0-9, +, /, =). Strings that don't match
    this format are rejected. If the string is not a valid base64 string, the rule will
    return a failure Result with code 'String.NotBase64'.
    `,
  });

export { Base64, NotBase64 };
