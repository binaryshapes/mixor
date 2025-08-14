import { err, ok, rule } from '@mixor/core';

import type { StringValueError } from './string';

/**
 * Result error type related to the string `isSlug` rule.
 *
 * @internal
 */
type InvalidSlug = StringValueError<'InvalidSlugError', 'isSlug'>;

/**
 * Instance of the `InvalidSlug` error type.
 *
 * @internal
 */
const InvalidSlug: InvalidSlug = {
  code: 'InvalidSlugError',
  context: 'StringValue',
  origin: 'isSlug',
  message: 'Value is not a valid slug',
};

// Regular expression for slug validation (from Zod source code).
const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Value rule that validates that the value is a valid slug.
 *
 * @param value - The string value to validate.
 * @returns A result indicating whether the value is a valid slug.
 *
 * @public
 */
const isSlug = rule((value: string) => (slug.test(value) ? ok(value) : err(InvalidSlug)));

export { isSlug };
