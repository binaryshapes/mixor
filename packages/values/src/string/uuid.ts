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
 * Regular expression for UUID validation with optional version specification.
 *
 * @remarks
 * If version is not provided, all versions are supported.
 * If version is provided, only that specific version is accepted.
 *
 * @param version - The UUID version to validate (1-8, or undefined for any version).
 * @returns A regular expression for the specified UUID version.
 *
 * @internal
 */
const uuidRegex = (version?: number): RegExp => {
  if (!version) {
    // All versions + null UUID
    return /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000)$/;
  }

  // Specific version
  return new RegExp(
    `^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${version}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`,
  );
};

/**
 * Creates a rule that checks if the string is a valid UUID.
 *
 * @remarks
 * A valid UUID follows the format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 * where x are hexadecimal characters. If a version is specified, only
 * that version is accepted. If no version is specified, any valid UUID
 * version is accepted. If the string is not a valid UUID, the rule will
 * return an error Result with code 'INVALID_UUID'.
 *
 * @param version - The UUID version to validate (1-8, or undefined for any version).
 * @returns A rule that validates UUIDs.
 *
 * @public
 */
const Uuid = rule((version?: number) => {
  const pattern = uuidRegex(version);
  return n.assert((value: string) => pattern.test(value), 'INVALID_UUID');
});

n.info(Uuid)
  .type('string')
  .params(['version', 'number'])
  .doc({
    title: 'Uuid',
    body: n.doc`
    A rule that checks if the string is a valid UUID. A valid UUID follows the format:
    xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx where x are hexadecimal characters. If a version
    is specified, only that version is accepted. If no version is specified, any valid UUID
    version is accepted. If the string is not a valid UUID, the rule will return a failure
    Result with code 'INVALID_UUID'.
    `,
  });

export { Uuid };
