/*
 * This file is part of the Mixor project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { builder, err, ok } from '@mixor/core';

// This patterns are taken from Zod source code.
const emailPattern = {
  common:
    /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9-]*\.)+[A-Za-z]{2,}$/,

  /** Equivalent to the HTML5 input[type=email] validation implemented by browsers. Source: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/email */
  html5Email:
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,

  /** The classic https://emailregex.com/ regex for RFC 5322-compliant emails */
  rfc5322Email:
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,

  /** A loose regex that allows Unicode characters, enforces length limits, and that's about it. */
  unicodeEmail: /^[^\s@"]{1,64}@[^\s@]{1,255}$/u,

  browserEmail:
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
};

/**
 * Validates that the value is a valid email address.
 *
 * @param type - The type of email pattern to use.
 * @returns A result indicating whether the value is a valid email address.
 *
 * @example
 * ```ts
 * // email-001: Basic email validation with default pattern.
 * const result = isEmail()('test@example.com');
 * // unwrap(result): 'test@example.com'.
 * ```
 *
 * @example
 * ```ts
 * // email-002: Email validation with specific pattern type.
 * const result = isEmail('html5Email')('user+tag@example.com');
 * // unwrap(result): 'user+tag@example.com'.
 * ```
 *
 * @example
 * ```ts
 * // email-003: Invalid email validation.
 * const result = isEmail()('invalid-email');
 * // unwrap(result): 'INVALID_EMAIL'.
 * ```
 *
 * @public
 */
const isEmail =
  (type: keyof typeof emailPattern = 'common') =>
  (value: string) =>
    emailPattern[type].test(value) ? ok(value) : err('INVALID_EMAIL');

/**
 * Validates that the value has a valid domain.
 *
 * @param domain - The domain to validate.
 * @returns A result indicating whether the value has a valid domain.
 *
 * @example
 * ```ts
 * // email-004: Single domain validation.
 * const result = hasDomain('example.com')('test@example.com');
 * // unwrap(result): 'test@example.com'.
 * ```
 *
 * @example
 * ```ts
 * // email-005: Multiple domains validation.
 * const result = hasDomain(['example.com', 'test.com'])('user@test.com');
 * // unwrap(result): 'user@test.com'.
 * ```
 *
 * @example
 * ```ts
 * // email-006: Invalid domain validation.
 * const result = hasDomain('example.com')('test@invalid.com');
 * // unwrap(result): 'INVALID_DOMAIN'.
 * ```
 *
 * @public
 */
const hasDomain = (domain: string | string[]) => (value: string) => {
  const domains = Array.isArray(domain) ? domain : [domain];
  const domainParts = value.split('@')[1];
  return domains.includes(domainParts) ? ok(value) : err('INVALID_DOMAIN');
};

/**
 * Creates a validation chain for email addresses.
 *
 * @returns A string validation builder for email addresses.
 *
 * @example
 * ```ts
 * // email-007: Email builder with validation.
 * const emailValidator = email.isEmail().build();
 * const result = emailValidator('test@example.com');
 * // unwrap(result): 'test@example.com'.
 * ```
 *
 * @example
 * ```ts
 * // email-008: Email builder with domain validation.
 * const domainValidator = email.hasDomain('example.com').build();
 * const result = domainValidator('test@example.com');
 * // unwrap(result): 'test@example.com'.
 * ```
 *
 * @public
 */
const email = builder({
  isEmail,
  hasDomain,
});

export {
  email,
  // For tree-shaking.
  isEmail,
  hasDomain,
};
