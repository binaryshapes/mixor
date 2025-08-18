import { err, ok, rule } from '@mixor/core';

import type { StringValueError } from './string';

/**
 * Result error type related to the string `url` rule.
 *
 * @internal
 */
type InvalidURL = StringValueError<'InvalidURLError', 'url'>;

/**
 * Instance of the `InvalidURL` error type.
 *
 * @internal
 */
const InvalidURL: InvalidURL = {
  code: 'InvalidURLError',
  context: 'StringValue',
  origin: 'url',
  message: 'Value is not a valid URL',
};

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
 * Creates a rule function that checks whether a string is a valid URL.
 *
 * @remarks
 * A valid URL follows the standard URL format and can be parsed by the URL constructor.
 * This rule validates URLs using the native URL API for robust validation.
 *
 * You can optionally specify protocol and hostname patterns to validate:
 * - `protocol`: Regex to validate the protocol (e.g., `/^https$/` for HTTPS only)
 * - `hostname`: Regex to validate the hostname (e.g., `/^example\.com$/` for specific domain)
 *
 * @param options - Optional validation options for protocol and hostname.
 * @returns A rule function that returns a Result containing the value if it is a valid
 * URL, or an error otherwise.
 *
 * @public
 */
const url = (options?: URLOptions) =>
  rule((value: string) => {
    try {
      const urlObj = new URL(value);

      // Validate protocol if specified
      if (options?.protocol) {
        const protocol = urlObj.protocol.replace(':', '');
        if (!options.protocol.test(protocol)) {
          return err(InvalidURL);
        }
      }

      // Validate hostname if specified
      if (options?.hostname && !options.hostname.test(urlObj.hostname)) {
        return err(InvalidURL);
      }

      return ok(value);
    } catch {
      return err(InvalidURL);
    }
  });

export { url };
