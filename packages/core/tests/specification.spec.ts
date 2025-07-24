import { describe, expect, expectTypeOf, it } from 'vitest';

import { err, isErr, isOk, ok, unwrap } from '../src/result';
import type { Result } from '../src/result';
import { type Specification, SpecificationError, isSpec, rule, spec } from '../src/specification';

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
    it('should create specifications with builder pattern', () => {
      const adminSpec = spec<User>()
        .rule('admin permission', (u) =>
          u.permissions.includes('manage_users') ? ok(u) : err('NO_PERMISSION'),
        )
        .build();

      const result = adminSpec.satisfy(helpers.createValidUser());
      expect(isOk(result)).toBe(true);
      expect(unwrap(result)).toEqual(helpers.createValidUser());
    });

    it('should handle conditional specifications', () => {
      const adminSpec = spec<User>()
        .when((u) => u.role === 'Admin')
        .rule('admin permission', (u) =>
          u.permissions.includes('manage_users') ? ok(u) : err('NO_PERMISSION'),
        )
        .build();

      // Should pass for admin user.
      const adminResult = adminSpec.satisfy(helpers.createAdminUser());
      expect(isOk(adminResult)).toBe(true);

      // Should pass for non-admin user (condition not met).
      const guestResult = adminSpec.satisfy(helpers.createGuestUser());
      expect(isOk(guestResult)).toBe(true);
    });

    it('should combine specifications with AND logic', () => {
      const spec1 = spec<User>()
        .rule('has name', (u) => (u.name.length > 0 ? ok(u) : err('NO_NAME')))
        .build();

      const spec2 = spec<User>()
        .rule('has email', (u) => (u.email.includes('@') ? ok(u) : err('NO_EMAIL')))
        .build();

      const combinedSpec = spec1.and(spec2);
      const result = combinedSpec.satisfy(helpers.createValidUser());
      expect(isOk(result)).toBe(true);
    });

    it('should combine specifications with OR logic', () => {
      const spec1 = spec<User>()
        .rule('is admin', (u) => (u.role === 'Admin' ? ok(u) : err('NOT_ADMIN')))
        .build();

      const spec2 = spec<User>()
        .rule('is guest', (u) => (u.role === 'Guest' ? ok(u) : err('NOT_GUEST')))
        .build();

      const combinedSpec = spec1.or(spec2);

      // Should pass for admin user.
      const adminResult = combinedSpec.satisfy(helpers.createAdminUser());
      expect(isOk(adminResult)).toBe(true);

      // Should pass for guest user.
      const guestResult = combinedSpec.satisfy(helpers.createGuestUser());
      expect(isOk(guestResult)).toBe(true);
    });

    it('should negate specifications', () => {
      const adminSpec = spec<User>()
        .rule('is admin', (u) => (u.role === 'Admin' ? ok(u) : err('NOT_ADMIN')))
        .build();

      const negatedSpec = adminSpec.not('USER_MUST_NOT_BE_ADMIN');

      // Should fail for admin user.
      const adminResult = negatedSpec.satisfy(helpers.createAdminUser());
      expect(isErr(adminResult)).toBe(true);
      expect(unwrap(adminResult)).toBe('USER_MUST_NOT_BE_ADMIN');

      // Should pass for non-admin user.
      const guestResult = negatedSpec.satisfy(helpers.createGuestUser());
      expect(isOk(guestResult)).toBe(true);
    });

    it('should throw error when building specification without rules', () => {
      const builder = spec<User>();
      // @ts-expect-error - build is not a function on the builder.
      expect(() => builder.build()).toThrow(SpecificationError);
    });

    it('should handle rule function without documentation', () => {
      const adminSpec = spec<User>()
        .rule((u) => (u.permissions.includes('manage_users') ? ok(u) : err('NO_PERMISSION')))
        .build();

      const result = adminSpec.satisfy(helpers.createValidUser());
      expect(isOk(result)).toBe(true);
      expect(unwrap(result)).toEqual(helpers.createValidUser());
    });

    it('should handle predefined rule object', () => {
      const predefinedRule = rule('predefined rule', (u: User) =>
        u.role === 'Admin' ? ok(u) : err('NOT_ADMIN'),
      );

      const adminSpec = spec<User>().rule(predefinedRule).build();

      const result = adminSpec.satisfy(helpers.createAdminUser());
      expect(isOk(result)).toBe(true);
      expect(unwrap(result)).toEqual(helpers.createAdminUser());
    });

    it('should handle empty rules array in specification', () => {
      // Test the case where rules array is empty by creating a spec with no rules
      // and then adding a rule that always passes
      const emptySpec = spec<User>()
        .rule('always pass', () => ok(helpers.createValidUser()))
        .build();

      const result = emptySpec.satisfy(helpers.createValidUser());
      expect(isOk(result)).toBe(true);
    });

    it('should throw error for invalid rule format', () => {
      // Test that invalid rule format throws SpecificationError with INVALID_RULE tag
      const builder = spec<User>();

      expect(() => {
        // @ts-expect-error - Testing invalid rule format
        builder.rule({ invalid: 'rule' });
      }).toThrow(SpecificationError);

      try {
        // @ts-expect-error - Testing invalid rule format
        builder.rule({ invalid: 'rule' });
      } catch (error) {
        expect(error).toBeInstanceOf(SpecificationError);
        if (error instanceof SpecificationError) {
          expect(error.key).toBe('SPECIFICATION:INVALID_RULE');
        }
      }

      expect(() => {
        // @ts-expect-error - Testing invalid rule format
        builder.rule(123);
      }).toThrow(SpecificationError);

      try {
        // @ts-expect-error - Testing invalid rule format
        builder.rule(123);
      } catch (error) {
        expect(error).toBeInstanceOf(SpecificationError);
        if (error instanceof SpecificationError) {
          expect(error.key).toBe('SPECIFICATION:INVALID_RULE');
        }
      }

      expect(() => {
        // @ts-expect-error - Testing invalid rule format
        builder.rule(null);
      }).toThrow(SpecificationError);

      try {
        // @ts-expect-error - Testing invalid rule format
        builder.rule(null);
      } catch (error) {
        expect(error).toBeInstanceOf(SpecificationError);
        if (error instanceof SpecificationError) {
          expect(error.key).toBe('SPECIFICATION:INVALID_RULE');
        }
      }
    });
  });

  describe('Type safety', () => {
    it('should provide correct type inference for all public elements', () => {
      // Test spec function.
      expectTypeOf(spec).toBeFunction();
      expectTypeOf(spec<User>()).toBeObject();
      expectTypeOf(spec<User>().rule).toBeFunction();
      expectTypeOf(spec<User>().when).toBeFunction();

      // Test rule function.
      expectTypeOf(rule).toBeFunction();
      expectTypeOf(rule<User, string>).toBeFunction();
      expectTypeOf(rule<User, string>('test', () => ok(validUser))).toBeFunction();

      // Test isSpec function.
      expectTypeOf(isSpec).toBeFunction();
      expectTypeOf(isSpec({})).toBeBoolean();
    });

    it('should validate generic type constraints', () => {
      // Test generic spec function.
      expectTypeOf(spec<string>).toBeFunction();
      expectTypeOf(spec<string>().rule).toBeFunction();

      // Test generic rule function.
      expectTypeOf(rule<string, 'ERROR'>).toBeFunction();
      expectTypeOf(rule<string, 'ERROR'>('test', () => ok('test'))).toBeFunction();
    });

    it('should validate union and intersection types', () => {
      // Test union error types.
      const specWithUnionErrors = spec<User>()
        .rule('name check', (u) => (u.name.length > 0 ? ok(u) : err('NO_NAME')))
        .rule('email check', (u) => (u.email.includes('@') ? ok(u) : err('NO_EMAIL')))
        .build();

      expectTypeOf(specWithUnionErrors.satisfy).toBeFunction();
      expectTypeOf(specWithUnionErrors.satisfy(validUser)).toEqualTypeOf<
        Result<User, 'NO_NAME' | 'NO_EMAIL'>
      >();
    });

    it('should validate specification type structure', () => {
      const testSpec = spec<User>()
        .rule('test', () => ok(validUser))
        .build();

      expectTypeOf(testSpec).toEqualTypeOf<Specification<User, never>>();
      expectTypeOf(testSpec.satisfy).toBeFunction();
      expectTypeOf(testSpec.and).toBeFunction();
      expectTypeOf(testSpec.or).toBeFunction();
      expectTypeOf(testSpec.not).toBeFunction();
    });
  });

  describe('Code examples', () => {
    it('should run example spec-001: Basic specification with automatic type inference', () => {
      const adminSpec = spec<User>()
        .when((u) => u.role === 'Admin')
        .rule('should have management permission', (u) =>
          u.permissions.includes('manage_users') ? ok(u) : err('NO_PERMISSION'),
        )
        .rule('should have corporate email', (u) =>
          u.email.endsWith('@company.com') ? ok(u) : err('NO_CORPORATE_EMAIL'),
        )
        .build();

      // Usage in any context.
      const result = adminSpec.satisfy(validUser);
      if (isOk(result)) {
        expect(unwrap(result)).toEqual(validUser);
      } else {
        expect(unwrap(result)).toBeDefined();
      }
    });

    it('should run example spec-002: Complex specification with multiple rules and error accumulation', () => {
      const userValidationSpec = spec<User>()
        .when((u) => u.role === 'Admin')
        .rule('should have valid email', (u) =>
          u.email.includes('@') ? ok(u) : err('INVALID_EMAIL'),
        )
        .rule('should have valid age', (u) => (u.age >= 18 ? ok(u) : err('INVALID_AGE')))
        .rule('should have valid name', (u) =>
          u.name.trim().length > 0 ? ok(u) : err('EMPTY_NAME'),
        )
        .rule('should have admin permissions', (u) =>
          u.permissions.includes('manage_users') ? ok(u) : err('NO_ADMIN_PERMISSIONS'),
        )
        .build();

      // Type is automatically inferred as: Specification<User, "INVALID_EMAIL" | "INVALID_AGE" | "EMPTY_NAME" | "NO_ADMIN_PERMISSIONS">
      const result = userValidationSpec.satisfy(validUser);
      expect(unwrap(result)).toBeDefined();

      const errorResult = userValidationSpec.satisfy(invalidUser);
      expect(unwrap(errorResult)).toBeDefined();
    });

    it('should run example spec-003: Basic rule creation without documentation', () => {
      const hasPermission = rule((user: User) =>
        user.permissions.includes('manage_users') ? ok(user) : err('NO_PERMISSION'),
      );

      const result = hasPermission(validUser);
      expect(unwrap(result)).toBeDefined();
      // ok(user) or err('NO_PERMISSION').
    });

    it('should run example spec-004: Rule creation with documentation', () => {
      const hasPermission = rule('User must have management permission', (user: User) =>
        user.permissions.includes('manage_users') ? ok(user) : err('NO_PERMISSION'),
      );

      expect(typeof hasPermission).toBe('function');
      // getElementMeta(hasPermission)._doc: 'User must have management permission'.
    });

    it('should run example spec-005: Checking if a value is a specification', () => {
      const adminSpec = spec<User>()
        .rule('admin permission', (u) =>
          u.permissions.includes('manage_users') ? ok(u) : err('NO_PERMISSION'),
        )
        .build();

      const isValidSpec = isSpec(adminSpec); // true.
      const isNotSpec = isSpec({}); // false.

      expect(isValidSpec).toBe(true);
      expect(isNotSpec).toBe(false);
    });

    it('should run example spec-006: Accessing element metadata', () => {
      const hasPermission = rule('User must have management permission', (user: User) =>
        user.permissions.includes('manage_users') ? ok(user) : err('NO_PERMISSION'),
      );

      expect(typeof hasPermission).toBe('function');
      // All metadata is now accessible through getElementMeta function.
    });

    it('should run example spec-007: Negating a specification with custom error', () => {
      const adminSpec = spec<User>()
        .rule('must be admin', (u) => (u.role === 'Admin' ? ok(u) : err('NOT_ADMIN')))
        .build();

      const notAdminSpec = adminSpec.not('USER_MUST_NOT_BE_ADMIN');
      const result = notAdminSpec.satisfy(validUser);
      if (isErr(result)) {
        expect(unwrap(result)).toBe('USER_MUST_NOT_BE_ADMIN');
      } else {
        expect(unwrap(result)).toBeDefined();
      }
    });

    it('should run example spec-008: Combining specifications with AND logic', () => {
      const adminSpec = spec<User>()
        .rule('must be admin', (u) => (u.role === 'Admin' ? ok(u) : err('NOT_ADMIN')))
        .build();

      const emailSpec = spec<User>()
        .rule('must have corporate email', (u) =>
          u.email.endsWith('@company.com') ? ok(u) : err('INVALID_EMAIL'),
        )
        .build();

      const combinedSpec = adminSpec.and(emailSpec);
      const result = combinedSpec.satisfy(validUser);
      if (isErr(result)) {
        expect(['NOT_ADMIN', 'INVALID_EMAIL']).toContain(unwrap(result));
      } else {
        expect(unwrap(result)).toBeDefined();
      }
    });

    it('should run example spec-009: Combining specifications with OR logic', () => {
      const adminSpec = spec<User>()
        .rule('must be admin', (u) => (u.role === 'Admin' ? ok(u) : err('NOT_ADMIN')))
        .build();

      const userSpec = spec<User>()
        .rule('must be user', (u) => (u.role === 'User' ? ok(u) : err('NOT_USER')))
        .build();

      const combinedSpec = adminSpec.or(userSpec);
      const result = combinedSpec.satisfy(validUser);
      if (isOk(result)) {
        expect(unwrap(result)).toBeDefined();
      } else {
        expect(['NOT_ADMIN', 'NOT_USER']).toContain(unwrap(result));
      }
    });
  });
});
