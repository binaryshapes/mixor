import { err, ok, rule } from '@mixor/core';

import type { StringValueError } from './string';

/**
 * Result error type related to the string `hasDomain` rule.
 *
 * @internal
 */
type InvalidDomain = StringValueError<'InvalidDomainError', 'hasDomain'>;

/**
 * Instance of the `InvalidDomain` error type.
 *
 * @internal
 */
const InvalidDomain: InvalidDomain = {
  code: 'InvalidDomainError',
  context: 'StringValue',
  origin: 'hasDomain',
  message: 'Email domain is not allowed',
};

/**
 * Creates a rule that validates that the email address has an allowed domain.
 *
 * @remarks
 * This rule extracts the domain part from an email address and validates
 * it against a list of allowed domains. It supports both single domain
 * and multiple domain validation.
 *
 * @param domain - The domain(s) to validate against. Can be a single string or array of strings.
 * @returns A rule that validates email domains.
 *
 * @public
 */
const hasDomain = (domain: string | string[]) =>
  rule((value: string) => {
    const domains = Array.isArray(domain) ? domain : [domain];
    const domainParts = value.split('@')[1];

    if (!domainParts) {
      return err(InvalidDomain);
    }

    return domains.includes(domainParts) ? ok(value) : err(InvalidDomain);
  });

export { hasDomain };
