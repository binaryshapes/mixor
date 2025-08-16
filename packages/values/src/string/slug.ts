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
 * Creates a rule function that checks whether a string is a valid slug.
 *
 * @remarks
 * A valid slug contains only lowercase letters, numbers, and hyphens. It must start
 * and end with alphanumeric characters and cannot have consecutive hyphens.
 *
 * @returns A rule function that returns a Result containing the value if it is a valid
 * slug, or an error otherwise.
 *
 * @public
 */
const slug = () => rule((value: string) => (slugRegex.test(value) ? ok(value) : err(InvalidSlug)));

export { slug };
