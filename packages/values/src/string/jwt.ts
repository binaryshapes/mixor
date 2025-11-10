/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { rule } from '@nuxo/components';
import { n } from '@nuxo/core';

// Regular expression for JWT validation.
const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;

/**
 * A rule that checks if the string is a valid JWT token.
 *
 * @remarks
 * A valid JWT (JSON Web Token) is a string that follows the format: header.payload.signature
 * where each part contains only alphanumeric characters, hyphens, and underscores.
 * The header and payload are required, while the signature is optional.
 * If the string is not a valid JWT token, the rule will return an error Result with
 * code 'INVALID_JWT'.
 *
 * @public
 */
const Jwt = rule(() => n.assert((value: string) => jwtRegex.test(value), 'INVALID_JWT'));

n.info(Jwt)
  .type('string')
  .doc({
    title: 'Jwt',
    body: n.doc`
    A rule that checks if the string is a valid JWT token. A valid JWT (JSON Web Token) is a
    string that follows the format: header.payload.signature where each part contains only
    alphanumeric characters, hyphens, and underscores. The header and payload are required,
    while the signature is optional. If the string is not a valid JWT token, the rule will
    return a failure Result with code 'INVALID_JWT'.
    `,
  });

export { Jwt };
