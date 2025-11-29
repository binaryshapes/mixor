/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { n } from '@nuxo/core';
import { decodeProtectedHeader, type JWTPayload, jwtVerify, SignJWT } from 'jose';
import { JOSEError } from 'jose/errors';

/**
 * Error code for when the JWT algorithm is invalid.
 */
const JWT_INVALID_ALGORITHM_ERROR = 'JWT_INVALID_ALGORITHM_ERROR' as const;

/**
 * Error code for when the JWT cannot be verified.
 */
const JWT_CANNOT_VERIFY_ERROR = 'JWT_CANNOT_VERIFY_ERROR' as const;

/**
 * Error code for when the JWT cannot be created.
 */
const JWT_CANNOT_CREATE_ERROR = 'JWT_CANNOT_CREATE_ERROR' as const;

/**
 * Type of the algorithm used to sign the JWT.
 *
 * Ref: https://www.jwt.io/libraries
 */
const JwtAlgorithm = {
  HS256: 'HS256',
  HS384: 'HS384',
  HS512: 'HS512',
  // XXX: Future support for other algorithms.
  // RS256: 'RS256',
  // RS384: 'RS384',
  // RS512: 'RS512',
  // ES256: 'ES256',
  // ES384: 'ES384',
  // ES512: 'ES512',
  // PS256: 'PS256',
  // PS384: 'PS384',
  // PS512: 'PS512',
  // EdDSA: 'EdDSA',
} as const;

/**
 * Type of the algorithm used to sign the JWT.
 */
type JwtAlgorithm = (typeof JwtAlgorithm)[keyof typeof JwtAlgorithm];

/**
 * Type of the expiration time of the JWT.
 */
type JwtExpirationTime = number | string | Date;

/**
 * Type of the options for the JWT provider.
 */
type JwtOptions = {
  /**
   * The algorithm used to sign the JWT.
   */
  alg: JwtAlgorithm;
  /**
   * The expiration time of the JWT.
   */
  expirationTime: JwtExpirationTime;
};

/**
 * Type of the errors of the JWT creation.
 */
type JwtCreateErrors = {
  $error: typeof JWT_CANNOT_CREATE_ERROR;
};

/**
 * Type of the errors of the JWT verification.
 */
type JwtVerifyErrors = {
  $error: typeof JWT_INVALID_ALGORITHM_ERROR | typeof JWT_CANNOT_VERIFY_ERROR;
};

/**
 * Type of the options for the JWT signing.
 */
type JwtSignOptions = {
  /**
   * The issuer of the JWT.
   */
  issuer?: string;
  /**
   * The audience of the JWT.
   */
  audience?: string;
};

/**
 * Default options for the JWT provider.
 *
 * @internal
 */
const DEFAULT_JWT_SIGN_OPTIONS: JwtSignOptions = {
  issuer: 'unknown',
  audience: 'unknown',
};

/**
 * Default options for the JWT provider.
 *
 * @internal
 */
const DEFAULT_JWT_OPTIONS: JwtOptions = {
  alg: JwtAlgorithm.HS256,
  expirationTime: '7d',
};

/**
 * JSON Web Token (JWT) provider.
 *
 * @public
 */
class JwtProvider {
  /**
   * The secret used to sign the JWT.
   */
  private readonly secret: Uint8Array;
  private readonly alg: JwtAlgorithm;
  private readonly expirationTime: JwtExpirationTime;

  /**
   * Creates a new JWT instance.
   * @param secret - The secret used to sign the JWT.
   */
  constructor(
    secret: string,
    options: JwtOptions = DEFAULT_JWT_OPTIONS,
  ) {
    this.secret = new TextEncoder().encode(secret);
    this.alg = options.alg;
    this.expirationTime = options.expirationTime;
  }

  /**
   * Creates a new JWT.
   * @param payload - The payload to sign.
   * @returns A success Result with the signed JWT if the JWT is created successfully,
   * otherwise an error.
   */
  public async create(
    payload: JWTPayload,
    options: JwtSignOptions = DEFAULT_JWT_SIGN_OPTIONS,
  ): Promise<n.Result<string, JwtCreateErrors>> {
    try {
      const jwt = new SignJWT(payload)
        .setProtectedHeader({ alg: this.alg })
        .setIssuedAt()
        .setExpirationTime(this.expirationTime);

      if (options.issuer && options.issuer !== DEFAULT_JWT_SIGN_OPTIONS.issuer) {
        jwt.setIssuer(options.issuer);
      }

      if (options.audience && options.audience !== DEFAULT_JWT_SIGN_OPTIONS.audience) {
        jwt.setAudience(options.audience);
      }

      return n.ok(await jwt.sign(this.secret));
    } catch (error: unknown) {
      n.logger.debug(`JWT creation error: ${error}`);
      return n.err({ $error: JWT_CANNOT_CREATE_ERROR });
    }
  }

  /**
   * Verifies a JWT token.
   * @param token - The JWT token to verify.
   * @returns A success Result with the payload of the JWT token if it is valid,
   * otherwise an error. The error will be a discriminated union of the possible errors.
   * The possible errors are:
   * - JWT_INVALID_ALGORITHM_ERROR: The JWT algorithm is invalid.
   * - JWT_CANNOT_VERIFY_ERROR: The JWT cannot be verified.
   */
  public async verify<T>(token: string): Promise<n.Result<T & JWTPayload, JwtVerifyErrors>> {
    try {
      // First, decode the header to check the algorithm before verification
      const protectedHeader = decodeProtectedHeader(token);

      // Check algorithm before attempting verification
      if (protectedHeader.alg !== this.alg) {
        return n.err({ $error: JWT_INVALID_ALGORITHM_ERROR });
      }

      // Now verify the token with the correct algorithm
      const { payload } = await jwtVerify(token, this.secret, {
        algorithms: [this.alg],
      });

      return n.ok(payload as T & JWTPayload);
    } catch (error: unknown) {
      if (error instanceof JOSEError) {
        n.logger.debug(`JWT verification error: ${error.code} ${error.message}`);
      }
      return n.err({ $error: JWT_CANNOT_VERIFY_ERROR });
    }
  }
}

/**
 * Creates a new JWT provider.
 * @param secret - The secret used to sign the JWT.
 * @param options - The options for the JWT provider.
 * @returns A new JWT provider.
 */
const Jwt = (secret: string, options: JwtOptions = DEFAULT_JWT_OPTIONS) => {
  const builder = n.provider();
  // HACK: Add secret and options to the builder so they're included in uniqueness calculation
  // This prevents the registry from reusing the same provider for different configurations
  Object.assign(builder, { secret, options });

  const jwtProvider = builder.provide(() => new JwtProvider(secret, options));

  if (!n.info(jwtProvider).props.doc) {
    n.info(jwtProvider)
      .doc({
        title: 'Jwt Provider',
        body:
          'The JWT provider is used to create and verify JWT tokens using the HS256 algorithm by default.',
      });
  }

  return jwtProvider;
};

export { Jwt, JwtAlgorithm };
