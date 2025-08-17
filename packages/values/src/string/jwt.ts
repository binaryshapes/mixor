import { err, ok, rule } from '@mixor/core';

import type { StringValueError } from './string';

/**
 * Result error type related to the string `jwt` rule.
 *
 * @internal
 */
type InvalidJWT = StringValueError<'InvalidJWTError', 'jwt'>;

/**
 * Instance of the `InvalidJWT` error type.
 *
 * @internal
 */
const InvalidJWT: InvalidJWT = {
  code: 'InvalidJWTError',
  context: 'StringValue',
  origin: 'jwt',
  message: 'Value is not a valid JWT token',
};

// Regular expression for JWT validation.
const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;

/**
 * Creates a rule function that checks whether a string is a valid JWT token.
 *
 * @remarks
 * A valid JWT (JSON Web Token) is a string that follows the format: header.payload.signature
 * where each part contains only alphanumeric characters, hyphens, and underscores.
 * The header and payload are required, while the signature is optional.
 *
 * @returns A rule function that returns a Result containing the value if it is a valid
 * JWT token, or an error otherwise.
 *
 * @public
 */
const jwt = () => rule((value: string) => (jwtRegex.test(value) ? ok(value) : err(InvalidJWT)));

export { jwt };
