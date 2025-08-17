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
 * Creates a rule function that checks whether a string is a valid URL.
 *
 * @remarks
 * A valid URL follows the standard URL format and can be parsed by the URL constructor.
 * This rule validates URLs using the native URL API for robust validation.
 *
 * @returns A rule function that returns a Result containing the value if it is a valid
 * URL, or an error otherwise.
 *
 * @public
 */
const url = () =>
  rule((value: string) => {
    try {
      new URL(value);
      return ok(value);
    } catch {
      return err(InvalidURL);
    }
  });

export { url };
