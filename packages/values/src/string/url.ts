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
 * Options for URL validation.
 *
 * @public
 */
interface URLOptions {
  /** Regular expression to validate the protocol (without colon). */
  protocol?: RegExp;
  /** Regular expression to validate the hostname. */
  hostname?: RegExp;
}

/**
 * Invalid URL failure.
 *
 * @internal
 */
class InvalidUrl extends n.failure(
  'String.InvalidUrl',
  {
    'en-US': 'The string must be a valid URL.',
    'es-ES': 'El texto debe ser una URL válida.',
  },
) {}

// Apply metadata to the InvalidUrl failure.
n.info(InvalidUrl)
  .doc({
    title: 'InvalidUrl Failure',
    body: n.doc`
    A failure that is returned when the string is not a valid URL.
    `,
  });

/**
 * Creates a rule that checks if the string is a valid URL.
 *
 * @remarks
 * A valid URL follows the standard URL format and can be parsed by the URL constructor.
 * This rule validates URLs using the native URL API for robust validation.
 *
 * You can optionally specify protocol and hostname patterns to validate:
 * - `protocol`: Regex to validate the protocol (e.g., `/^https$/` for HTTPS only)
 * - `hostname`: Regex to validate the hostname (e.g., `/^example\.com$/` for specific domain)
 *
 * If the string is not a valid URL, the rule will return an error Result with
 * code 'String.InvalidUrl'.
 *
 * @param options - Optional validation options for protocol and hostname.
 * @returns A rule that validates URLs.
 *
 * @public
 */
const Url = rule((options?: URLOptions) =>
  n.assert((value: string) => {
    try {
      const urlObj = new URL(value);

      // Validate protocol if specified
      if (options?.protocol) {
        const protocol = urlObj.protocol.replace(':', '');
        if (!options.protocol.test(protocol)) {
          return false;
        }
      }

      // Validate hostname if specified
      if (options?.hostname && !options.hostname.test(urlObj.hostname)) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }, new InvalidUrl())
);

n.info(Url)
  .type('string')
  .params(['options', 'URLOptions'])
  .doc({
    title: 'Url',
    body: n.doc`
    A rule that checks if the string is a valid URL. A valid URL follows the standard URL
    format and can be parsed by the URL constructor. This rule validates URLs using the native
    URL API for robust validation. You can optionally specify protocol and hostname patterns
    to validate. If the string is not a valid URL, the rule will return a failure Result with
    code 'String.InvalidUrl'.
    `,
  });

export { InvalidUrl, Url };
export type { URLOptions };
