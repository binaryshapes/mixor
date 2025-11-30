/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { n } from '@nuxo/core';
import { assertEquals, assertExists } from '@std/assert';
import type { JWTPayload } from 'jose';

import { Jwt, JwtAlgorithm } from '../src/jwt.ts';

n.config.set('NUXO_DEBUG', false);

const jwtProvider = Jwt('test-secret-key')();

const jwtProviderHS256 = Jwt('test-secret-key', {
  alg: JwtAlgorithm.HS256,
  expirationTime: '1h',
})();

const jwtProviderHS384 = Jwt('test-secret-key', {
  alg: JwtAlgorithm.HS384,
  expirationTime: '1h',
})();

Deno.test('JWT - should create a JWT token successfully', async () => {
  const payload: JWTPayload = {
    sub: 'user123',
    email: 'user@example.com',
  };

  const result = await jwtProvider.create(payload);

  assertEquals(n.isOk(result), true);
  if (n.isOk(result)) {
    const token = result.value;
    assertExists(token);
    assertEquals(typeof token, 'string');
    // JWT tokens have three parts separated by dots
    assertEquals(token.split('.').length, 3);
  }
});

Deno.test('JWT - should verify a valid JWT token successfully', async () => {
  const payload: JWTPayload = {
    sub: 'user123',
    email: 'user@example.com',
  };

  const createResult = await jwtProvider.create(payload);

  assertEquals(n.isOk(createResult), true);
  if (n.isOk(createResult)) {
    const token = createResult.value;

    const verifyResult = await jwtProvider.verify<{ sub: string; email: string }>(token);

    assertEquals(n.isOk(verifyResult), true);
    if (n.isOk(verifyResult)) {
      const verifiedPayload = verifyResult.value;
      assertEquals(verifiedPayload.sub, 'user123');
      assertEquals(verifiedPayload.email, 'user@example.com');
      assertExists(verifiedPayload.iat); // issued at
      assertExists(verifiedPayload.exp); // expiration
    }
  }
});

Deno.test('JWT - should return error when verifying JWT with invalid algorithm', async () => {
  const payload: JWTPayload = {
    sub: 'user123',
  };

  // Create token with HS256
  const createResult = await jwtProviderHS256.create(payload);
  assertEquals(n.isOk(createResult), true);
  if (n.isOk(createResult)) {
    const token = createResult.value;
    // Try to verify with HS384 (different algorithm)
    // Note: jwtVerify with algorithms option should reject tokens with different algorithms.
    const verifyResult = await jwtProviderHS384.verify(token);

    assertEquals(n.isErr(verifyResult), true);
    const error = n.unwrap(verifyResult);
    assertEquals(error.$error, 'JWT_INVALID_ALGORITHM_ERROR');
  }
});

Deno.test('JWT - should return error when verifying invalid or tampered JWT', async () => {
  // Invalid JWT token (tampered)
  const invalidToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMTIzIn0.tampered-signature';

  const verifyResult = await jwtProvider.verify(invalidToken);

  assertEquals(n.isErr(verifyResult), true);
  const error = n.unwrap(verifyResult);
  assertEquals(error.$error, 'JWT_CANNOT_VERIFY_ERROR');
});

Deno.test('JWT - should create and verify JWT all supported algorithms successfully', async () => {
  const algorithms: Array<JwtAlgorithm> = [
    JwtAlgorithm.HS256,
    JwtAlgorithm.HS384,
    JwtAlgorithm.HS512,
  ];
  const secret = 'test-secret-key-for-multiple-algorithms';
  const payload: JWTPayload = {
    sub: 'user123',
    name: 'Test User',
  };

  for (const alg of algorithms) {
    const jwtProvider = Jwt(secret, { alg, expirationTime: '1h' })();

    // Create token
    const createResult = await jwtProvider.create(payload);
    assertEquals(n.isOk(createResult), true);

    if (n.isOk(createResult)) {
      const token = createResult.value;
      assertExists(token);
      // Verify token
      const verifyResult = await jwtProvider.verify<{ sub: string; name: string }>(token);
      assertEquals(n.isOk(verifyResult), true);
      if (n.isOk(verifyResult)) {
        const verifiedPayload = verifyResult.value;
        assertEquals(verifiedPayload.sub, 'user123');
        assertEquals(verifiedPayload.name, 'Test User');
      }
    }
  }
});

Deno.test('JWT - should create and verify JWT with custom options successfully', async () => {
  const payload: JWTPayload = {
    name: 'Test User',
  };

  const createResult = await jwtProvider.create(payload, {
    issuer: 'test-issuer',
    audience: 'test-audience',
    subject: 'test-subject',
  });

  assertEquals(n.isOk(createResult), true);

  if (n.isOk(createResult)) {
    const token = createResult.value;
    assertExists(token);
    // Verify token
    const verifyResult = await jwtProvider.verify<{ sub: string; name: string }>(token);
    assertEquals(n.isOk(verifyResult), true);
    if (n.isOk(verifyResult)) {
      const verifiedPayload = verifyResult.value;

      assertEquals(verifiedPayload.name, 'Test User');
      assertEquals(verifiedPayload.iss, 'test-issuer');
      assertEquals(verifiedPayload.aud, 'test-audience');
      assertEquals(verifiedPayload.sub, 'test-subject');
    }
  }
});

Deno.test('JWT - should fail to create JWT with invalid algorithm', async () => {
  const payload: JWTPayload = {
    sub: 'user123',
    name: 'Test User',
  };

  const jwtInvalid = Jwt('test-secret-key', {
    alg: 'invalid-algorithm' as never,
    expirationTime: '1h',
  })();

  const createResult = await jwtInvalid.create(payload);

  assertEquals(n.isErr(createResult), true);

  if (n.isErr(createResult)) {
    const error = createResult.error;
    assertEquals(error.$error, 'JWT_CANNOT_CREATE_ERROR');
  }
});
