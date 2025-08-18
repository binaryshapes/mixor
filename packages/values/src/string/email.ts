import { err, ok, rule } from '@mixor/core';

import type { StringValueError } from './string';

/**
 * Result error type related to the string `email` rule.
 *
 * @internal
 */
type InvalidEmail = StringValueError<'InvalidEmailError', 'email'>;

/**
 * Instance of the `InvalidEmail` error type.
 *
 * @internal
 */
const InvalidEmail: InvalidEmail = {
  code: 'InvalidEmailError',
  context: 'StringValue',
  origin: 'email',
  message: 'Value is not a valid email address',
};

/**
 * Email patterns taken from Zod source code.
 *
 * @internal
 */
const emailPattern = {
  common:
    /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9-]*\.)+[A-Za-z]{2,}$/,

  /** Equivalent to the HTML5 input[type=email] validation implemented by browsers */
  html5Email:
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,

  /** The classic https://emailregex.com/ regex for RFC 5322-compliant emails */
  rfc5322Email:
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,

  /** A loose regex that allows Unicode characters, enforces length limits */
  unicodeEmail: /^[^\s@"]{1,64}@[^\s@]{1,255}$/u,

  browserEmail:
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
};

/**
 * Creates a rule that validates that the value is a valid email address.
 *
 * @remarks
 * This rule supports multiple email validation patterns:
 * - `common`: Standard email validation (default)
 * - `html5Email`: HTML5 input[type=email] validation
 * - `rfc5322Email`: RFC 5322-compliant email validation
 * - `unicodeEmail`: Unicode-aware email validation with length limits
 * - `browserEmail`: Browser-compatible email validation
 *
 * @param type - The type of email pattern to use. Defaults to 'common'.
 * @returns A rule that validates email addresses.
 *
 * @public
 */
const email = (type: keyof typeof emailPattern = 'common') =>
  rule((value: string) => (emailPattern[type].test(value) ? ok(value) : err(InvalidEmail)));

export { email };
