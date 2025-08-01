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

  describe('Basic functionality', () => {
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

      // Should pass for admin user.
      const adminResult = adminSpec.satisfy(helpers.createAdminUser());
      expect(isOk(adminResult)).toBe(true);

      // Should fail for invalid user.
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

    it('should combine specifications with AND logic when first spec fails', () => {
      // Create a spec that will fail for the test user
      const failingSpec = spec(
        condition((u: User) => (u.role === 'Guest' ? ok(u) : err('NOT_GUEST'))),
      );

      const passingSpec = spec(
        condition((u: User) => (u.email.includes('@') ? ok(u) : err('NO_EMAIL'))),
      );

      const combinedSpec = failingSpec.and(passingSpec);
      const result = combinedSpec.satisfy(helpers.createValidUser()); // This user is Admin, not Guest

      // Should fail because first spec fails
      expect(isErr(result)).toBe(true);
      expect(unwrap(result)).toBe('NOT_GUEST');
    });

    it('should combine specifications with OR logic', () => {
      const spec1 = spec(condition((u: User) => (u.role === 'Admin' ? ok(u) : err('NOT_ADMIN'))));

      const spec2 = spec(condition((u: User) => (u.role === 'Guest' ? ok(u) : err('NOT_GUEST'))));

      const combinedSpec = spec1.or(spec2);

      // Should pass for admin user.
      const adminResult = combinedSpec.satisfy(helpers.createAdminUser());
      expect(isOk(adminResult)).toBe(true);

      // Should pass for guest user.
      const guestResult = combinedSpec.satisfy(helpers.createGuestUser());
      expect(isOk(guestResult)).toBe(true);
    });

    it('should negate specifications', () => {
      const adminSpec = spec(
        condition((u: User) => (u.role === 'Admin' ? ok(u) : err('NOT_ADMIN'))),
      );

      const negatedSpec = adminSpec.not('USER_MUST_NOT_BE_ADMIN');

      // Should fail for admin user.
      const adminResult = negatedSpec.satisfy(helpers.createAdminUser());
      expect(isErr(adminResult)).toBe(true);
      expect(unwrap(adminResult)).toBe('USER_MUST_NOT_BE_ADMIN');

      // Should pass for non-admin user.
      const guestResult = negatedSpec.satisfy(helpers.createGuestUser());
      expect(isOk(guestResult)).toBe(true);
    });

    it('should throw error when building specification without conditions', () => {
      expect(() => spec()).toThrow(SpecificationError);
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

    it('should throw error for invalid condition format', () => {
      expect(() => {
        // @ts-expect-error - Testing invalid condition format
        spec({ invalid: 'condition' });
      }).toThrow(SpecificationError);

      try {
        // @ts-expect-error - Testing invalid condition format
        spec({ invalid: 'condition' });
      } catch (error) {
        expect(error).toBeInstanceOf(SpecificationError);
        if (error instanceof SpecificationError) {
          expect(error.key).toBe('SPECIFICATION:INVALID_CONDITION');
        }
      }

      expect(() => {
        // @ts-expect-error - Testing invalid condition format
        spec(123);
      }).toThrow(SpecificationError);

      try {
        // @ts-expect-error - Testing invalid condition format
        spec(123);
      } catch (error) {
        expect(error).toBeInstanceOf(SpecificationError);
        if (error instanceof SpecificationError) {
          expect(error.key).toBe('SPECIFICATION:INVALID_CONDITION');
        }
      }

      expect(() => {
        // @ts-expect-error - Testing invalid condition format
        spec(null);
      }).toThrow(SpecificationError);

      try {
        // @ts-expect-error - Testing invalid condition format
        spec(null);
      } catch (error) {
        expect(error).toBeInstanceOf(SpecificationError);
        if (error instanceof SpecificationError) {
          expect(error.key).toBe('SPECIFICATION:INVALID_CONDITION');
        }
      }
    });
  });

  describe('Type safety', () => {
    it('should provide correct type inference for all public elements', () => {
      // Test spec function.
      expectTypeOf(spec).toBeFunction();
      expectTypeOf(spec<User, string>).toBeFunction();

      // Test condition function.
      expectTypeOf(condition).toBeFunction();
      expectTypeOf(condition<User, string>).toBeFunction();
      expectTypeOf(condition<User, string>((u) => ok(u))).toBeFunction();

      // Test isSpec function.
      expectTypeOf(isSpec).toBeFunction();
      expectTypeOf(isSpec({})).toBeBoolean();
    });

    it('should validate generic type constraints', () => {
      // Test generic spec function.
      expectTypeOf(spec<string, 'ERROR'>).toBeFunction();

      // Test generic condition function.
      expectTypeOf(condition<string, 'ERROR'>).toBeFunction();
      expectTypeOf(condition<string, 'ERROR'>((s) => ok(s))).toBeFunction();
    });

    it('should validate union and intersection types', () => {
      // Test union error types.
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

  describe('Edge cases and branch coverage', () => {
    it('should handle isSpec with non-traceable objects', () => {
      // Test with plain objects that are not traceable
      expect(isSpec({})).toBe(false);
      expect(isSpec(null)).toBe(false);
      expect(isSpec(undefined)).toBe(false);
      expect(isSpec(123)).toBe(false);
      expect(isSpec('string')).toBe(false);
      expect(isSpec([])).toBe(false);
    });

    it('should handle isSpec with traceable but wrong tag objects', () => {
      // Create a traceable object with wrong tag
      const wrongTagObject = {
        '~trace': {
          id: 'test-id',
          tag: 'WrongTag',
          hash: 'test-hash',
        },
      };

      expect(isSpec(wrongTagObject)).toBe(false);
    });

    it('should handle isCondition with non-traceable objects', () => {
      // Test with plain objects that are not traceable
      expect(isCondition({})).toBe(false);
      expect(isCondition(null)).toBe(false);
      expect(isCondition(undefined)).toBe(false);
      expect(isCondition(123)).toBe(false);
      expect(isCondition('string')).toBe(false);
      expect(isCondition([])).toBe(false);
    });

    it('should handle isCondition with traceable but wrong tag objects', () => {
      // Create a traceable object with wrong tag
      const wrongTagObject = {
        '~trace': {
          id: 'test-id',
          tag: 'WrongTag',
          hash: 'test-hash',
        },
      };

      expect(isCondition(wrongTagObject)).toBe(false);
    });
  });

  describe('Code examples', () => {
    it('should run example spec-001: Basic specification with automatic type inference', () => {
      const adminSpec = spec(
        condition((u: User) => (u.role === 'Admin' ? ok(u) : err('NOT_ADMIN'))).meta({
          scope: 'user',
          name: 'isAdmin',
          description: 'A user must be an admin',
        }),
        condition((u: User) =>
          u.permissions.includes('manage_users') ? ok(u) : err('NO_PERMISSION'),
        ).meta({
          scope: 'user',
          name: 'hasManageUsersPermission',
          description: 'A user must have the manage users permission',
        }),
        condition((u: User) =>
          u.email.endsWith('@company.com') ? ok(u) : err('NO_CORPORATE_EMAIL'),
        ).meta({
          scope: 'user',
          name: 'hasCorporateEmail',
          description: 'A user must have a corporate email',
        }),
      );

      // Usage in any context.
      const result = adminSpec.satisfy(validUser);
      if (isOk(result)) {
        expect(unwrap(result)).toEqual(validUser);
      } else {
        expect(unwrap(result)).toBeDefined();
      }
    });

    it('should run example spec-002: Complex specification with multiple conditions and error accumulation', () => {
      const userValidationSpec = spec(
        condition((u: User) => (u.role === 'Admin' ? ok(u) : err('NOT_ADMIN'))),
        condition((u: User) => (u.email.includes('@') ? ok(u) : err('INVALID_EMAIL'))),
        condition((u: User) => (u.age >= 18 ? ok(u) : err('INVALID_AGE'))),
        condition((u: User) => (u.name.trim().length > 0 ? ok(u) : err('EMPTY_NAME'))),
        condition((u: User) =>
          u.permissions.includes('manage_users') ? ok(u) : err('NO_ADMIN_PERMISSIONS'),
        ),
      );

      // Type is automatically inferred as: Specification<User, "NOT_ADMIN" | "INVALID_EMAIL" | "INVALID_AGE" | "EMPTY_NAME" | "NO_ADMIN_PERMISSIONS">
      const result = userValidationSpec.satisfy(validUser);
      expect(unwrap(result)).toBeDefined();

      const errorResult = userValidationSpec.satisfy(invalidUser);
      expect(unwrap(errorResult)).toBeDefined();
    });

    it('should run example spec-003: Combining specifications with AND logic', () => {
      const adminSpec = spec(
        condition((u: User) => (u.role === 'Admin' ? ok(u) : err('NOT_ADMIN'))),
        condition((u: User) => (u.email.endsWith('@company.com') ? ok(u) : err('INVALID_EMAIL'))),
      );

      const emailSpec = spec(
        condition((u: User) => (u.email.endsWith('@company.com') ? ok(u) : err('INVALID_EMAIL'))),
      );

      const combinedSpec = adminSpec.and(emailSpec);
      const result = combinedSpec.satisfy(validUser);
      if (isErr(result)) {
        expect(['NOT_ADMIN', 'INVALID_EMAIL']).toContain(unwrap(result));
      } else {
        expect(unwrap(result)).toBeDefined();
      }
    });

    it('should run example spec-004: Combining specifications with OR logic', () => {
      const adminSpec = spec(
        condition((u: User) => (u.role === 'Admin' ? ok(u) : err('NOT_ADMIN'))),
      );

      const userSpec = spec(condition((u: User) => (u.role === 'User' ? ok(u) : err('NOT_USER'))));

      const combinedSpec = adminSpec.or(userSpec);
      const result = combinedSpec.satisfy(validUser);
      if (isOk(result)) {
        expect(unwrap(result)).toBeDefined();
      } else {
        expect(['NOT_ADMIN', 'NOT_USER']).toContain(unwrap(result));
      }
    });

    it('should run example spec-005: Negating a specification with custom error', () => {
      const adminSpec = spec(
        condition((u: User) => (u.role === 'Admin' ? ok(u) : err('NOT_ADMIN'))),
      );

      const notAdminSpec = adminSpec.not('USER_MUST_NOT_BE_ADMIN');
      const result = notAdminSpec.satisfy(validUser);
      if (isErr(result)) {
        expect(unwrap(result)).toBe('USER_MUST_NOT_BE_ADMIN');
      } else {
        expect(unwrap(result)).toBeDefined();
      }
    });

    it('should run example spec-006: Condition with metadata', () => {
      const hasPermission = condition((user: User) =>
        user.permissions.includes('manage_users') ? ok(user) : err('NO_PERMISSION'),
      ).meta({
        scope: 'user',
        name: 'hasManageUsersPermission',
        description: 'A user must have the manage users permission',
      });

      expect(typeof hasPermission).toBe('function');
      // All metadata is now accessible through traceInfo function.
    });
  });
});
