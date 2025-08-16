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
 * Creates a value rule function that validates string values are valid slugs.
 *
 * @remarks
 * A slug is a URL-friendly string that contains only lowercase letters, numbers,
 * and hyphens. It must start and end with alphanumeric characters and cannot
 * have consecutive hyphens.
 *
 * @returns A rule function that validates that the value is a valid slug format.
 * This function returns a Result type with the value if it is a valid slug, or an error
 * if it is not.
 *
 * @public
 */
const slug = () => rule((value: string) => (slugRegex.test(value) ? ok(value) : err(InvalidSlug)));

export { slug };
