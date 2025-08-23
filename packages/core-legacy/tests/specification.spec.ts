import { describe, expect, expectTypeOf, it } from 'vitest';

import { err, isErr, isOk, ok, unwrap } from '../src/result';
import type { Result } from '../src/result';
import {
  type Specification,
  SpecificationError,
  condition,
  isCondition,
  isSpec,
  spec,
} from '../src/specification';

// Test data types.
type User = {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'User' | 'Guest';
  permissions: string[];
  age: number;
  isActive: boolean;
};

const validUser: User = {
  id: '1',
  name: 'John Doe',
  email: 'john@company.com',
  role: 'Admin',
  permissions: ['manage_users', 'read_data'],
  age: 30,
  isActive: true,
};

const invalidUser: User = {
  id: '2',
  name: '',
  email: 'invalid-email',
  role: 'Guest',
  permissions: [],
  age: 15,
  isActive: false,
};

// Shared test utilities.
const createTestHelpers = () => ({
  createValidUser: () => ({ ...validUser }),
  createInvalidUser: () => ({ ...invalidUser }),
  createAdminUser: () => ({ ...validUser, role: 'Admin' as const }),
  createGuestUser: () => ({ ...validUser, role: 'Guest' as const }),
});

describe('Specification', () => {
  const helpers = createTestHelpers();

  describe('Public API', () => {
    it('should create specifications with conditions', () => {
      const adminSpec = spec(
        condition((u: User) =>
          u.permissions.includes('manage_users') ? ok(u) : err('NO_PERMISSION'),
        ),
      );

      const result = adminSpec.satisfy(helpers.createValidUser());
      expect(isOk(result)).toBe(true);
      expect(unwrap(result)).toEqual(helpers.createValidUser());
    });

    it('should handle multiple conditions', () => {
      const adminSpec = spec(
        condition((u: User) =>
          u.permissions.includes('manage_users') ? ok(u) : err('NO_PERMISSION'),
        ),
        condition((u: User) =>
          u.email.endsWith('@company.com') ? ok(u) : err('NO_CORPORATE_EMAIL'),
        ),
      );

      const adminResult = adminSpec.satisfy(helpers.createAdminUser());
      expect(isOk(adminResult)).toBe(true);

      const invalidResult = adminSpec.satisfy(helpers.createInvalidUser());
      expect(isErr(invalidResult)).toBe(true);
    });

    it('should combine specifications with AND logic', () => {
      const spec1 = spec(condition((u: User) => (u.name.length > 0 ? ok(u) : err('NO_NAME'))));
      const spec2 = spec(condition((u: User) => (u.email.includes('@') ? ok(u) : err('NO_EMAIL'))));

      const combinedSpec = spec1.and(spec2);
      const result = combinedSpec.satisfy(helpers.createValidUser());
      expect(isOk(result)).toBe(true);
    });

    it('should combine specifications with OR logic', () => {
      const spec1 = spec(condition((u: User) => (u.role === 'Admin' ? ok(u) : err('NOT_ADMIN'))));
      const spec2 = spec(condition((u: User) => (u.role === 'Guest' ? ok(u) : err('NOT_GUEST'))));

      const combinedSpec = spec1.or(spec2);

      const adminResult = combinedSpec.satisfy(helpers.createAdminUser());
      expect(isOk(adminResult)).toBe(true);

      const guestResult = combinedSpec.satisfy(helpers.createGuestUser());
      expect(isOk(guestResult)).toBe(true);
    });

    it('should negate specifications', () => {
      const adminSpec = spec(
        condition((u: User) => (u.role === 'Admin' ? ok(u) : err('NOT_ADMIN'))),
      );

      const negatedSpec = adminSpec.not('USER_MUST_NOT_BE_ADMIN');

      const adminResult = negatedSpec.satisfy(helpers.createAdminUser());
      expect(isErr(adminResult)).toBe(true);
      expect(unwrap(adminResult)).toBe('USER_MUST_NOT_BE_ADMIN');

      const guestResult = negatedSpec.satisfy(helpers.createGuestUser());
      expect(isOk(guestResult)).toBe(true);
    });

    it('should handle condition function', () => {
      const adminSpec = spec(
        condition((u: User) =>
          u.permissions.includes('manage_users') ? ok(u) : err('NO_PERMISSION'),
        ),
      );

      const result = adminSpec.satisfy(helpers.createValidUser());
      expect(isOk(result)).toBe(true);
      expect(unwrap(result)).toEqual(helpers.createValidUser());
    });

    it('should handle predefined condition object', () => {
      const predefinedCondition = condition((u: User) =>
        u.role === 'Admin' ? ok(u) : err('NOT_ADMIN'),
      );

      const adminSpec = spec(predefinedCondition);
      const result = adminSpec.satisfy(helpers.createAdminUser());
      expect(isOk(result)).toBe(true);
      expect(unwrap(result)).toEqual(helpers.createAdminUser());
    });
  });

  describe('Edge Cases & Error Handling', () => {
    it('should throw error when building specification without conditions', () => {
      expect(() => spec()).toThrow(SpecificationError);
    });

    it('should throw error for invalid condition format', () => {
      try {
        // @ts-expect-error - Testing invalid condition format
        spec({ invalid: 'condition' });
      } catch (error) {
        expect(error).toBeInstanceOf(SpecificationError);
        if (error instanceof SpecificationError) {
          expect(error.code).toBe('Specification:InvalidCondition');
        }
      }
    });

    it('should handle AND logic when first spec fails', () => {
      const failingSpec = spec(
        condition((u: User) => (u.role === 'Guest' ? ok(u) : err('NOT_GUEST'))),
      );
      const passingSpec = spec(
        condition((u: User) => (u.email.includes('@') ? ok(u) : err('NO_EMAIL'))),
      );

      const combinedSpec = failingSpec.and(passingSpec);
      const result = combinedSpec.satisfy(helpers.createValidUser());

      expect(isErr(result)).toBe(true);
      expect(unwrap(result)).toBe('NOT_GUEST');
    });

    it('should handle isSpec with invalid objects', () => {
      expect(isSpec({})).toBe(false);
      expect(isSpec(null)).toBe(false);
      expect(isSpec(undefined)).toBe(false);
      expect(isSpec(123)).toBe(false);
      expect(isSpec('string')).toBe(false);
      expect(isSpec([])).toBe(false);
    });
  });

  describe('Type Safety', () => {
    it('should provide correct type inference for all public elements', () => {
      expectTypeOf(spec).toBeFunction();
      expectTypeOf(spec<User, string>).toBeFunction();
      expectTypeOf(condition).toBeFunction();
      expectTypeOf(condition<User, string>).toBeFunction();
      expectTypeOf(condition<User, string>((u) => ok(u))).toBeFunction();
      expectTypeOf(isSpec).toBeFunction();
      expectTypeOf(isSpec({})).toBeBoolean();
      expectTypeOf(isCondition).toBeFunction();
      expectTypeOf(isCondition({})).toBeBoolean();
    });

    it('should validate generic type constraints', () => {
      expectTypeOf(spec<string, 'ERROR'>).toBeFunction();
      expectTypeOf(condition<string, 'ERROR'>).toBeFunction();
      expectTypeOf(condition<string, 'ERROR'>((s) => ok(s))).toBeFunction();
    });

    it('should validate union and intersection types', () => {
      const specWithUnionErrors = spec(
        condition((u: User) => (u.name.length > 0 ? ok(u) : err('NO_NAME'))),
        condition((u: User) => (u.email.includes('@') ? ok(u) : err('NO_EMAIL'))),
      );

      expectTypeOf(specWithUnionErrors.satisfy).toBeFunction();
      expectTypeOf(specWithUnionErrors.satisfy(validUser)).toEqualTypeOf<
        Result<User, 'NO_NAME' | 'NO_EMAIL'>
      >();
    });

    it('should validate specification type structure', () => {
      const testSpec = spec(condition(() => ok(validUser)));

      expectTypeOf(testSpec).toEqualTypeOf<Specification<User, never>>();
      expectTypeOf(testSpec.satisfy).toBeFunction();
      expectTypeOf(testSpec.and).toBeFunction();
      expectTypeOf(testSpec.or).toBeFunction();
      expectTypeOf(testSpec.not).toBeFunction();
    });
  });
});
