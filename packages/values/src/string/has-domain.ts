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
 * Creates a rule that validates that the email address has an allowed domain.
 *
 * @remarks
 * This rule extracts the domain part from an email address and validates
 * it against a list of allowed domains. It supports both single domain
 * and multiple domain validation. If the email domain is not allowed, the rule
 * will return an error Result with code 'INVALID_DOMAIN'.
 *
 * @param domain - The domain(s) to validate against. Can be a single string or array of strings.
 * @returns A rule that validates email domains.
 *
 * @public
 */
const HasDomain = rule((domain: string | string[]) =>
  n.assert((value: string) => {
    const domains = Array.isArray(domain) ? domain : [domain];
    const domainParts = value.split('@')[1];

    if (!domainParts) {
      return false;
    }

    return domains.includes(domainParts);
  }, 'INVALID_DOMAIN')
);

n.info(HasDomain)
  .type('string')
  .params(['domain', 'string | string[]'])
  .doc({
    title: 'HasDomain',
    body: n.doc`
    A rule that validates that the email address has an allowed domain. This rule extracts
    the domain part from an email address and validates it against a list of allowed domains.
    It supports both single domain and multiple domain validation. If the email domain is not
    allowed, the rule will return a failure Result with code 'INVALID_DOMAIN'.
    `,
  });

export { HasDomain };
