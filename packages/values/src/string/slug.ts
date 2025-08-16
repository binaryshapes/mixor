import { err, ok, rule } from '@mixor/core';

import type { StringValueError } from './string';

/**
 * Result error type related to the string `slug` rule.
 *
 * @internal
 */
type InvalidSlug = StringValueError<'InvalidSlugError', 'slug'>;

/**
 * Instance of the `InvalidSlug` error type.
 *
 * @internal
 */
const InvalidSlug: InvalidSlug = {
  code: 'InvalidSlugError',
  context: 'StringValue',
  origin: 'slug',
  message: 'Value is not a valid slug',
};

// Regular expression for slug validation (from Zod source code).
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Value rule constructor that validates that the value is a valid slug.
 *
 * @returns A rule function that validates that return a result indicating whether the value
 * is a valid slug.
 *
 * @public
 */
const slug = () => rule((value: string) => (slugRegex.test(value) ? ok(value) : err(InvalidSlug)));

export { slug };
