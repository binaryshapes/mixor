import { describe, expect, expectTypeOf, it } from 'vitest';

import { err, ok, unwrap } from '../src/result';
import type { Result } from '../src/result';
import { type Specification, rule, spec } from '../src/specification';

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

describe('specification', () => {
  describe('Type definitions', () => {
    it('should handle type definition example', () => {
      // Test for type definitions and interfaces.
      expect(typeof rule).toBe('function');
      expect(typeof spec).toBe('function');
    });
  });

  describe('Basic functionality', () => {
    it('should handle basic functionality', () => {
      // Test for basic API functionality.
      const basicRule = rule('test rule', (user: User) => ok(user));
      expect(basicRule._tag).toBe('Rule');
      expect(basicRule._doc).toBe('test rule');
    });
  });

  describe('Advanced functionality', () => {
    it('should handle advanced functionality', () => {
      // Test for advanced API functionality.
      const spec1 = spec<User>()
        .when(() => true)
        .rule('test', (u) => ok(u))
        .build();
      expect(spec1._tag).toBe('Specification');
    });
  });

  describe('Code examples', () => {
    it('should run example spec-001: Basic rule function with explicit error type', () => {
      // spec-001: Basic rule function with explicit error type.
      const hasPermission: (user: User) => Result<User, string> = (user) =>
        user.permissions.includes('manage_users') ? ok(user) : err('NO_PERMISSION');

      const result = hasPermission(validUser);
      expect(unwrap(result)).toEqual(validUser);

      const errorResult = hasPermission(invalidUser);
      expect(unwrap(errorResult)).toEqual('NO_PERMISSION');
    });

    it('should run example spec-002: Basic rule creation and usage', () => {
      // spec-002: Basic rule creation and usage.
      const hasPermission = rule((user: User) =>
        user.permissions.includes('manage_users') ? ok(user) : err('NO_PERMISSION'),
      );

      // Validate entity.
      const result = hasPermission(validUser);
      expect(unwrap(result)).toEqual(validUser);

      const errorResult = hasPermission(invalidUser);
      expect(unwrap(errorResult)).toEqual('NO_PERMISSION');
    });

    it('should run example spec-003: Rule with documentation', () => {
      // spec-003: Rule with documentation.
      const hasPermission = rule('User must have management permission', (user: User) =>
        user.permissions.includes('manage_users') ? ok(user) : err('NO_PERMISSION'),
      );

      expect(hasPermission._doc).toBe('User must have management permission');
      expect(hasPermission._tag).toBe('Rule');

      const result = hasPermission(validUser);
      expect(unwrap(result)).toEqual(validUser);
    });

    it('should run example spec-004: Basic condition function', () => {
      // spec-004: Basic condition function.
      const isAdmin: (user: User) => boolean = (user) => user.role === 'Admin';

      expect(isAdmin(validUser)).toBe(true);
      expect(isAdmin(invalidUser)).toBe(false);
    });

    it('should run example spec-005: Basic specification with automatic type inference', () => {
      // spec-005: Basic specification with automatic type inference.
      const adminSpec = spec<User>()
        .when((u) => u.role === 'Admin')
        .rule('should have management permission', (u) =>
          u.permissions.includes('manage_users') ? ok(u) : err('NO_PERMISSION'),
        )
        .build();

      const result = adminSpec.satisfy(validUser);
      expect(unwrap(result)).toEqual(validUser);

      // When condition is false, specification should be satisfied without checking rules
      const errorResult = adminSpec.satisfy(invalidUser);
      expect(unwrap(errorResult)).toEqual(invalidUser);
    });

    it('should run example spec-006: Specification with multiple rules and error accumulation', () => {
      // spec-006: Specification with multiple rules and error accumulation.
      const userSpec = spec<User>()
        .when(() => true) // Always true condition to allow rules
        .rule('should have valid email', (u) =>
          u.email.includes('@') ? ok(u) : err('INVALID_EMAIL'),
        )
        .rule('should have valid age', (u) => (u.age >= 18 ? ok(u) : err('INVALID_AGE')))
        .rule('should have valid name', (u) =>
          u.name.trim().length > 0 ? ok(u) : err('EMPTY_NAME'),
        )
        .build();

      // Type is automatically inferred as: Specification<User, "INVALID_EMAIL" | "INVALID_AGE" | "EMPTY_NAME">
      const result = userSpec.satisfy(validUser);
      expect(unwrap(result)).toEqual(validUser);

      const errorResult = userSpec.satisfy(invalidUser);
      expect(unwrap(errorResult)).toEqual('INVALID_EMAIL');
    });

    it('should run example spec-007: Combining specifications with AND logic', () => {
      // spec-007: Combining specifications with AND logic.
      const basicSpec = spec<User>()
        .when(() => true)
        .rule('valid email', (u) => (u.email.includes('@') ? ok(u) : err('INVALID_EMAIL')))
        .build();
      const adminSpec = spec<User>()
        .when(() => true)
        .rule('admin permission', (u) =>
          u.permissions.includes('manage_users') ? ok(u) : err('NO_PERMISSION'),
        )
        .build();
      const combined = basicSpec.and(adminSpec);

      const result = combined.satisfy(validUser);
      expect(unwrap(result)).toEqual(validUser);

      const errorResult = combined.satisfy(invalidUser);
      expect(unwrap(errorResult)).toEqual('INVALID_EMAIL');
    });

    it('should run example spec-008: Combining specifications with OR logic', () => {
      // spec-008: Combining specifications with OR logic.
      const adminSpec = spec<User>()
        .when(() => true)
        .rule('admin role', (u) => (u.role === 'Admin' ? ok(u) : err('NOT_ADMIN')))
        .build();
      const userSpec = spec<User>()
        .when(() => true)
        .rule('user role', (u) => (u.role === 'User' ? ok(u) : err('NOT_USER')))
        .build();
      const combined = adminSpec.or(userSpec);

      const result = combined.satisfy(validUser);
      expect(unwrap(result)).toEqual(validUser);

      // Create a user with role 'User' to test OR logic
      const userWithUserRole: User = { ...invalidUser, role: 'User' };
      const userResult = combined.satisfy(userWithUserRole);
      expect(unwrap(userResult)).toEqual(userWithUserRole);

      const errorResult = combined.satisfy(invalidUser);
      expect(unwrap(errorResult)).toEqual('NOT_USER');
    });

    it('should run example spec-009: Negating a specification', () => {
      // spec-009: Negating a specification.
      const adminSpec = spec<User>()
        .when(() => true)
        .rule('admin role', (u) => (u.role === 'Admin' ? ok(u) : err('NOT_ADMIN')))
        .build();
      const notAdminSpec = adminSpec.not();
      // notAdminSpec is satisfied when user is NOT an admin.

      const result = notAdminSpec.satisfy(invalidUser);
      expect(unwrap(result)).toEqual(invalidUser);

      const errorResult = notAdminSpec.satisfy(validUser);
      expect(unwrap(errorResult)).toEqual('Specification should not be satisfied');
    });

    it('should run example spec-010: Basic specification builder usage', () => {
      // spec-010: Basic specification builder usage.
      const adminSpec = spec<User>()
        .when((u) => u.role === 'Admin')
        .rule('should have management permission', (u) =>
          u.permissions.includes('manage_users') ? ok(u) : err('NO_PERMISSION'),
        )
        .build();

      const result = adminSpec.satisfy(validUser);
      expect(unwrap(result)).toEqual(validUser);
    });

    it('should run example spec-011: Using when condition to apply rules only in specific cases', () => {
      // spec-011: Using when condition to apply rules only in specific cases.
      const adminSpec = spec<User>().when((u) => u.role === 'Admin');

      const result = adminSpec.build().satisfy(validUser);
      expect(unwrap(result)).toEqual(validUser);

      const nonAdminResult = adminSpec.build().satisfy(invalidUser);
      expect(unwrap(nonAdminResult)).toEqual(invalidUser);
    });

    it('should run example spec-012: Adding a predefined rule to the specification', () => {
      // spec-012: Adding a predefined rule to the specification.
      const hasPermission = rule('admin permission', (u: User) =>
        u.permissions.includes('manage_users') ? ok(u) : err('NO_PERMISSION'),
      );
      const adminSpec = spec<User>()
        .when(() => true)
        .rule(hasPermission);

      const result = adminSpec.build().satisfy(validUser);
      expect(unwrap(result)).toEqual(validUser);
    });

    it('should run example spec-013: Adding an inline rule with documentation', () => {
      // spec-013: Adding an inline rule with documentation.
      const adminSpec = spec<User>()
        .when(() => true)
        .rule('User must have management permission', (u) =>
          u.permissions.includes('manage_users') ? ok(u) : err('NO_PERMISSION'),
        );

      const result = adminSpec.build().satisfy(validUser);
      expect(unwrap(result)).toEqual(validUser);
    });

    it('should run example spec-014: Building a complete specification', () => {
      // spec-014: Building a complete specification.
      const adminSpec = spec<User>()
        .when((u) => u.role === 'Admin')
        .rule('should have management permission', (u) =>
          u.permissions.includes('manage_users') ? ok(u) : err('NO_PERMISSION'),
        )
        .rule('should have corporate email', (u) =>
          u.email.endsWith('@company.com') ? ok(u) : err('NON_CORPORATE_EMAIL'),
        )
        .build();

      const result = adminSpec.satisfy(validUser);
      expect(unwrap(result)).toEqual(validUser);
    });

    it('should run example spec-015: Basic rule creation without documentation', () => {
      // spec-015: Basic rule creation without documentation.
      const hasPermission = rule((user: User) =>
        user.permissions.includes('manage_users') ? ok(user) : err('NO_PERMISSION'),
      );

      const result = hasPermission(validUser);
      expect(unwrap(result)).toEqual(validUser);

      const errorResult = hasPermission(invalidUser);
      expect(unwrap(errorResult)).toEqual('NO_PERMISSION');
    });

    it('should run example spec-016: Rule creation with documentation', () => {
      // spec-016: Rule creation with documentation.
      const hasPermission = rule('User must have management permission', (user: User) =>
        user.permissions.includes('manage_users') ? ok(user) : err('NO_PERMISSION'),
      );

      expect(hasPermission._doc).toBe('User must have management permission');
      expect(hasPermission._tag).toBe('Rule');
    });

    it('should run example spec-017: Basic specification with automatic type inference', () => {
      // spec-017: Basic specification with automatic type inference.
      const adminSpec = spec<User>()
        .when((u) => u.role === 'Admin')
        .rule('should have management permission', (u) =>
          u.permissions.includes('manage_users') ? ok(u) : err('NO_PERMISSION'),
        )
        .rule('should have corporate email', (u) =>
          u.email.endsWith('@company.com') ? ok(u) : err('NON_CORPORATE_EMAIL'),
        )
        .build();

      // Usage in any context.
      const result = adminSpec.satisfy(validUser);
      expect(unwrap(result)).toEqual(validUser);
    });

    it('should run example spec-018: Complex specification with multiple rules and error accumulation', () => {
      // spec-018: Complex specification with multiple rules and error accumulation.
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
      expect(unwrap(result)).toEqual(validUser);

      // When condition is false, specification should be satisfied without checking rules
      const errorResult = userValidationSpec.satisfy(invalidUser);
      expect(unwrap(errorResult)).toEqual(invalidUser);
    });
  });

  describe('Type safety', () => {
    it('should provide correct type inference', () => {
      // Typechecking tests.
      const spec1 = spec<User>()
        .when(() => true)
        .rule('error1', (u) => ok(u) as Result<User, 'E1'>)
        .rule('error2', (u) => ok(u) as Result<User, 'E2'>)
        .build();

      // Type should be automatically inferred as: Specification<User, "E1" | "E2">
      expect(spec1._tag).toBe('Specification');

      // Typecheck.
      expectTypeOf(spec1).toEqualTypeOf<Specification<User, 'E1' | 'E2'>>();
    });

    it('should handle complex type inference with multiple rules', () => {
      const complexSpec = spec<User>()
        .when(() => true)
        .rule('email validation', (u) => (u.email.includes('@') ? ok(u) : err('INVALID_EMAIL')))
        .rule('age validation', (u) => (u.age >= 18 ? ok(u) : err('INVALID_AGE')))
        .rule('name validation', (u) => (u.name.trim().length > 0 ? ok(u) : err('EMPTY_NAME')))
        .build();

      // Type should be: Specification<User, "INVALID_EMAIL" | "INVALID_AGE" | "EMPTY_NAME">
      expect(complexSpec._tag).toBe('Specification');

      // Typecheck.
      expectTypeOf(complexSpec).toEqualTypeOf<
        Specification<User, 'INVALID_EMAIL' | 'INVALID_AGE' | 'EMPTY_NAME'>
      >();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty specification', () => {
      const emptySpec = spec<User>().build();
      const result = emptySpec.satisfy(validUser);
      expect(unwrap(result)).toEqual(validUser);
    });

    it('should handle specification with only condition', () => {
      const conditionSpec = spec<User>()
        .when((u) => u.role === 'Admin')
        .build();
      const result = conditionSpec.satisfy(validUser);
      expect(unwrap(result)).toEqual(validUser);
    });

    it('should handle condition that returns false', () => {
      const conditionSpec = spec<User>()
        .when((u) => u.role === 'Guest')
        .build();
      const result = conditionSpec.satisfy(validUser);
      expect(unwrap(result)).toEqual(validUser);
    });

    it('should handle multiple rules with different error types', () => {
      const multiErrorSpec = spec<User>()
        .when(() => true)
        .rule('email', (u) => (u.email.includes('@') ? ok(u) : err('EMAIL_ERROR')))
        .rule('age', (u) => (u.age >= 18 ? ok(u) : err('AGE_ERROR')))
        .rule('name', (u) => (u.name.length > 0 ? ok(u) : err('NAME_ERROR')))
        .build();

      const result = multiErrorSpec.satisfy(validUser);
      expect(unwrap(result)).toEqual(validUser);

      const errorResult = multiErrorSpec.satisfy(invalidUser);
      expect(unwrap(errorResult)).toEqual('EMAIL_ERROR');
    });

    it('should force when() to be called before rules', () => {
      // This test demonstrates the new API that forces when() before rules
      const forcedWhenSpec = spec<User>()
        .when((u) => u.role === 'Admin')
        .rule('should have management permission', (u) =>
          u.permissions.includes('manage_users') ? ok(u) : err('NO_PERMISSION'),
        )
        .rule('should have corporate email', (u) =>
          u.email.endsWith('@company.com') ? ok(u) : err('NON_CORPORATE_EMAIL'),
        )
        .build();

      const result = forcedWhenSpec.satisfy(validUser);
      expect(unwrap(result)).toEqual(validUser);

      // When condition is false, specification should be satisfied without checking rules
      const errorResult = forcedWhenSpec.satisfy(invalidUser);
      expect(unwrap(errorResult)).toEqual(invalidUser);
    });

    it('should handle specification with condition that returns false and rules', () => {
      // Test the case where condition is false but there are rules
      const specWithFalseCondition = spec<User>()
        .when((u) => u.role === 'Guest')
        .rule('should have management permission', (u) =>
          u.permissions.includes('manage_users') ? ok(u) : err('NO_PERMISSION'),
        )
        .build();

      const result = specWithFalseCondition.satisfy(validUser);
      expect(unwrap(result)).toEqual(validUser);
    });

    it('should handle specification with rules but no condition', () => {
      // Test the case where there are rules but no condition (using specWithRules directly)
      const specWithRulesOnly = spec<User>()
        .when(() => true)
        .rule('should have valid email', (u) =>
          u.email.includes('@') ? ok(u) : err('INVALID_EMAIL'),
        )
        .build();

      const result = specWithRulesOnly.satisfy(validUser);
      expect(unwrap(result)).toEqual(validUser);

      const errorResult = specWithRulesOnly.satisfy(invalidUser);
      expect(unwrap(errorResult)).toEqual('INVALID_EMAIL');
    });

    it('should handle specification with empty rules array', () => {
      // Test the case where rules array is empty
      const emptyRulesSpec = spec<User>()
        .when(() => true)
        .build();

      const result = emptyRulesSpec.satisfy(validUser);
      expect(unwrap(result)).toEqual(validUser);
    });

    it('should handle specification with condition that returns false and empty rules', () => {
      // Test the case where condition is false and rules array is empty
      const falseConditionEmptyRules = spec<User>()
        .when((u) => u.role === 'Guest')
        .build();

      const result = falseConditionEmptyRules.satisfy(validUser);
      expect(unwrap(result)).toEqual(validUser);
    });

    it('should handle specification with condition that returns false and has rules', () => {
      // Test the case where condition is false but there are rules (should skip rules)
      const falseConditionWithRules = spec<User>()
        .when((u) => u.role === 'Guest')
        .rule('should have management permission', (u) =>
          u.permissions.includes('manage_users') ? ok(u) : err('NO_PERMISSION'),
        )
        .build();

      const result = falseConditionWithRules.satisfy(validUser);
      expect(unwrap(result)).toEqual(validUser);
    });

    it('should handle specification with condition that returns true and has rules', () => {
      // Test the case where condition is true and there are rules
      const trueConditionWithRules = spec<User>()
        .when((u) => u.role === 'Admin')
        .rule('should have management permission', (u) =>
          u.permissions.includes('manage_users') ? ok(u) : err('NO_PERMISSION'),
        )
        .build();

      const result = trueConditionWithRules.satisfy(validUser);
      expect(unwrap(result)).toEqual(validUser);
    });

    it('should handle specification with condition that returns true but rules fail', () => {
      const specWithTrueConditionAndFailingRules = spec<User>()
        .when((u) => u.role === 'Admin')
        .rule('should have management permission', (u) =>
          u.permissions.includes('manage_users') ? ok(u) : err('NO_PERMISSION'),
        )
        .build();
      const notSpec = specWithTrueConditionAndFailingRules.not();

      // Create a user with Admin role but without management permissions
      const adminUserWithoutPermissions: User = {
        ...invalidUser,
        role: 'Admin',
        permissions: ['read_data'], // No 'manage_users' permission
      };

      const result = notSpec.satisfy(adminUserWithoutPermissions);
      // When the spec fails (returns err), the negation should return ok(entity)
      expect(unwrap(result)).toEqual(adminUserWithoutPermissions);
    });

    it('should handle specification with multiple rules where first fails', () => {
      // Test the case where the first rule fails
      const firstRuleFails = spec<User>()
        .when(() => true)
        .rule('should have valid email', (u) =>
          u.email.includes('@') ? ok(u) : err('INVALID_EMAIL'),
        )
        .rule('should have valid age', (u) => (u.age >= 18 ? ok(u) : err('INVALID_AGE')))
        .build();

      const result = firstRuleFails.satisfy(invalidUser);
      expect(unwrap(result)).toEqual('INVALID_EMAIL');
    });

    it('should handle specification with multiple rules where second fails', () => {
      // Test the case where the second rule fails
      const secondRuleFails = spec<User>()
        .when(() => true)
        .rule('should have valid email', (u) =>
          u.email.includes('@') ? ok(u) : err('INVALID_EMAIL'),
        )
        .rule('should have valid age', (u) => (u.age >= 18 ? ok(u) : err('INVALID_AGE')))
        .build();

      // Create a user with valid email but invalid age
      const userWithValidEmailInvalidAge: User = {
        ...invalidUser,
        email: 'valid@email.com',
        age: 15,
      };

      const result = secondRuleFails.satisfy(userWithValidEmailInvalidAge);
      expect(unwrap(result)).toEqual('INVALID_AGE');
    });

    it('should handle specification with multiple rules where all pass', () => {
      // Test the case where all rules pass
      const allRulesPass = spec<User>()
        .when(() => true)
        .rule('should have valid email', (u) =>
          u.email.includes('@') ? ok(u) : err('INVALID_EMAIL'),
        )
        .rule('should have valid age', (u) => (u.age >= 18 ? ok(u) : err('INVALID_AGE')))
        .build();

      const result = allRulesPass.satisfy(validUser);
      expect(unwrap(result)).toEqual(validUser);
    });

    it('should handle specification with documentation from first rule', () => {
      // Test the case where documentation comes from the first rule
      const hasPermission = rule('User must have management permission', (u: User) =>
        u.permissions.includes('manage_users') ? ok(u) : err('NO_PERMISSION'),
      );

      const specWithDoc = spec<User>()
        .when(() => true)
        .rule(hasPermission)
        .build();

      expect(specWithDoc._doc).toBe('User must have management permission');
    });

    it('should handle specification with custom documentation', () => {
      // Test the case where custom documentation is provided
      const specWithCustomDoc = spec<User>('Custom specification documentation')
        .when(() => true)
        .rule('should have valid email', (u) =>
          u.email.includes('@') ? ok(u) : err('INVALID_EMAIL'),
        )
        .build();

      expect(specWithCustomDoc._doc).toBe('Custom specification documentation');
    });

    it('should handle specification with no documentation and no rules', () => {
      // Test the case where there's no documentation and no rules
      const specNoDocNoRules = spec<User>()
        .when(() => true)
        .build();

      expect(specNoDocNoRules._doc).toBeUndefined();
    });

    it('should handle specification with no documentation but has rules', () => {
      // Test the case where there's no documentation but has rules
      const hasPermission = rule('User must have management permission', (u: User) =>
        u.permissions.includes('manage_users') ? ok(u) : err('NO_PERMISSION'),
      );

      const specNoDocWithRules = spec<User>()
        .when(() => true)
        .rule(hasPermission)
        .build();

      expect(specNoDocWithRules._doc).toBe('User must have management permission');
    });
  });

  describe('Builder operations', () => {
    it('should handle AND operation with empty specification', () => {
      const emptySpec = spec<User>().build();
      const otherSpec = spec<User>()
        .when(() => true)
        .rule('test', (u) => ok(u))
        .build();
      const combined = emptySpec.and(otherSpec);

      const result = combined.satisfy(validUser);
      expect(unwrap(result)).toEqual(validUser);
    });

    it('should handle OR operation with empty specification', () => {
      const emptySpec = spec<User>().build();
      const otherSpec = spec<User>()
        .when(() => true)
        .rule('test', (u) => ok(u))
        .build();
      const combined = emptySpec.or(otherSpec);

      const result = combined.satisfy(validUser);
      expect(unwrap(result)).toEqual(validUser);
    });

    it('should handle NOT operation with empty specification', () => {
      const emptySpec = spec<User>().build();
      const notSpec = emptySpec.not();

      const result = notSpec.satisfy(validUser);
      expect(unwrap(result)).toEqual('Specification should not be satisfied');
    });

    it('should handle AND operation where first specification fails', () => {
      const failingSpec = spec<User>()
        .when(() => true)
        .rule('should have valid email', (u) =>
          u.email.includes('@') ? ok(u) : err('INVALID_EMAIL'),
        )
        .build();
      const passingSpec = spec<User>()
        .when(() => true)
        .rule('test', (u) => ok(u))
        .build();
      const combined = failingSpec.and(passingSpec);

      const result = combined.satisfy(invalidUser);
      expect(unwrap(result)).toEqual('INVALID_EMAIL');
    });

    it('should handle AND operation where second specification fails', () => {
      const passingSpec = spec<User>()
        .when(() => true)
        .rule('test', (u) => ok(u))
        .build();
      const failingSpec = spec<User>()
        .when(() => true)
        .rule('should have valid email', (u) =>
          u.email.includes('@') ? ok(u) : err('INVALID_EMAIL'),
        )
        .build();
      const combined = passingSpec.and(failingSpec);

      const result = combined.satisfy(invalidUser);
      expect(unwrap(result)).toEqual('INVALID_EMAIL');
    });

    it('should handle OR operation where first specification passes', () => {
      const passingSpec = spec<User>()
        .when(() => true)
        .rule('test', (u) => ok(u))
        .build();
      const failingSpec = spec<User>()
        .when(() => true)
        .rule('should have valid email', (u) =>
          u.email.includes('@') ? ok(u) : err('INVALID_EMAIL'),
        )
        .build();
      const combined = passingSpec.or(failingSpec);

      const result = combined.satisfy(invalidUser);
      expect(unwrap(result)).toEqual(invalidUser);
    });

    it('should handle OR operation where second specification passes', () => {
      const failingSpec = spec<User>()
        .when(() => true)
        .rule('should have valid email', (u) =>
          u.email.includes('@') ? ok(u) : err('INVALID_EMAIL'),
        )
        .build();
      const passingSpec = spec<User>()
        .when(() => true)
        .rule('test', (u) => ok(u))
        .build();
      const combined = failingSpec.or(passingSpec);

      const result = combined.satisfy(invalidUser);
      expect(unwrap(result)).toEqual(invalidUser);
    });

    it('should handle OR operation where both specifications fail', () => {
      const failingSpec1 = spec<User>()
        .when(() => true)
        .rule('should have valid email', (u) =>
          u.email.includes('@') ? ok(u) : err('INVALID_EMAIL'),
        )
        .build();
      const failingSpec2 = spec<User>()
        .when(() => true)
        .rule('should have valid age', (u) => (u.age >= 18 ? ok(u) : err('INVALID_AGE')))
        .build();
      const combined = failingSpec1.or(failingSpec2);

      const result = combined.satisfy(invalidUser);
      // When both specifications fail, OR returns the error from the first specification
      expect(['INVALID_EMAIL', 'INVALID_AGE']).toContain(unwrap(result));
    });

    it('should handle NOT operation with condition that returns false', () => {
      const specWithFalseCondition = spec<User>()
        .when((u) => u.role === 'Guest')
        .build();
      const notSpec = specWithFalseCondition.not();

      const result = notSpec.satisfy(validUser);
      expect(unwrap(result)).toEqual('Specification should not be satisfied');
    });

    it('should handle NOT operation with condition that returns true and rules pass', () => {
      const specWithTrueConditionAndPassingRules = spec<User>()
        .when((u) => u.role === 'Admin')
        .rule('test', (u) => ok(u))
        .build();
      const notSpec = specWithTrueConditionAndPassingRules.not();

      const result = notSpec.satisfy(validUser);
      expect(unwrap(result)).toEqual('Specification should not be satisfied');
    });

    it('should handle NOT operation with condition that returns true but rules fail', () => {
      const specWithTrueConditionAndFailingRules = spec<User>()
        .when((u) => u.role === 'Admin')
        .rule('should have management permission', (u) =>
          u.permissions.includes('manage_users') ? ok(u) : err('NO_PERMISSION'),
        )
        .build();
      const notSpec = specWithTrueConditionAndFailingRules.not();

      // Create a user with Admin role but without management permissions
      const adminUserWithoutPermissions: User = {
        ...invalidUser,
        role: 'Admin',
        permissions: ['read_data'], // No 'manage_users' permission
      };

      const result = notSpec.satisfy(adminUserWithoutPermissions);
      // When the spec fails (returns err), the negation should return ok(entity)
      expect(unwrap(result)).toEqual(adminUserWithoutPermissions);
    });

    it('should handle NOT operation with condition that returns false and rules', () => {
      const specWithFalseConditionAndRules = spec<User>()
        .when((u) => u.role === 'Guest')
        .rule('should have management permission', (u) =>
          u.permissions.includes('manage_users') ? ok(u) : err('NO_PERMISSION'),
        )
        .build();
      const notSpec = specWithFalseConditionAndRules.not();

      const result = notSpec.satisfy(validUser);
      expect(unwrap(result)).toEqual('Specification should not be satisfied');
    });
  });

  describe('Edge cases and uncovered code', () => {
    it('should handle spec() build() with rules and conditions', () => {
      // Test the spec() function's build() method when it has rules and conditions
      // This covers the uncovered lines in the spec() function's build method
      const testSpec = spec<User>('Test spec', (u) => u.role === 'Admin', [
        rule('test rule', (u) => (u.age >= 18 ? ok(u) : err('INVALID_AGE'))),
      ]);

      const result = testSpec.build();
      expect(result._tag).toBe('Specification');
      expect(result._doc).toBe('Test spec');

      // Test with condition that fails
      const failResult = result.satisfy(invalidUser);
      expect(unwrap(failResult)).toEqual(invalidUser);

      // Test with condition that passes but rule fails
      const userWithAdminRole: User = { ...invalidUser, role: 'Admin' };
      const ruleFailResult = result.satisfy(userWithAdminRole);
      expect(unwrap(ruleFailResult)).toEqual('INVALID_AGE');
    });

    it('should handle spec() build() with empty rules array', () => {
      // Test the spec() function's build() method with empty rules
      const testSpec = spec<User>('Empty spec', (u) => u.role === 'Admin', []);

      const result = testSpec.build();
      expect(result._tag).toBe('Specification');

      // Test with condition that fails
      const failResult = result.satisfy(invalidUser);
      expect(unwrap(failResult)).toEqual(invalidUser);

      // Test with condition that passes and no rules
      const userWithAdminRole: User = { ...invalidUser, role: 'Admin' };
      const passResult = result.satisfy(userWithAdminRole);
      expect(unwrap(passResult)).toEqual(userWithAdminRole);
    });

    it('should handle spec() build() with no condition', () => {
      // Test the spec() function's build() method with no condition
      const testSpec = spec<User>('No condition spec', undefined, [
        rule('test rule', (u) => (u.age >= 18 ? ok(u) : err('INVALID_AGE'))),
      ]);

      const result = testSpec.build();
      expect(result._tag).toBe('Specification');

      // Test with valid user
      const validResult = result.satisfy(validUser);
      expect(unwrap(validResult)).toEqual(validUser);

      // Test with invalid user
      const invalidResult = result.satisfy(invalidUser);
      expect(unwrap(invalidResult)).toEqual('INVALID_AGE');
    });

    it('should handle spec() build() and() operation', () => {
      // Test the and() operation in spec() function's build method
      const testSpec = spec<User>('Test spec', (u) => u.role === 'Admin', [
        rule('test rule', (u) => (u.age >= 18 ? ok(u) : err('INVALID_AGE'))),
      ]);

      const result = testSpec.build();
      const otherSpec = spec<User>()
        .when(() => true)
        .rule('other rule', (u) => (u.name.length > 0 ? ok(u) : err('EMPTY_NAME')))
        .build();

      const combined = result.and(otherSpec);

      // Test with valid user
      const validResult = combined.satisfy(validUser);
      expect(unwrap(validResult)).toEqual(validUser);

      // Test with invalid user (first spec condition fails, so first spec is satisfied, but second spec fails)
      const invalidResult = combined.satisfy(invalidUser);
      expect(unwrap(invalidResult)).toEqual('EMPTY_NAME'); // First spec condition fails, second spec fails
    });

    it('should handle spec() build() or() operation', () => {
      // Test the or() operation in spec() function's build method
      const testSpec = spec<User>('Test spec', (u) => u.role === 'Admin', [
        rule('test rule', (u) => (u.age >= 18 ? ok(u) : err('INVALID_AGE'))),
      ]);

      const result = testSpec.build();
      const otherSpec = spec<User>()
        .when(() => true)
        .rule('other rule', (u) => (u.name.length > 0 ? ok(u) : err('EMPTY_NAME')))
        .build();

      const combined = result.or(otherSpec);

      // Test with valid user (first spec should succeed)
      const validResult = combined.satisfy(validUser);
      expect(unwrap(validResult)).toEqual(validUser);

      // Test with user that fails first spec but passes second
      const userWithAdminRole: User = { ...invalidUser, role: 'Admin' };
      const mixedResult = combined.satisfy(userWithAdminRole);
      expect(unwrap(mixedResult)).toEqual('EMPTY_NAME'); // First spec fails, second is tried and fails
    });

    it('should handle spec() build() not() operation', () => {
      // Test the not() operation in spec() function's build method
      const testSpec = spec<User>('Test spec', (u) => u.role === 'Admin', [
        rule('test rule', (u) => (u.age >= 18 ? ok(u) : err('INVALID_AGE'))),
      ]);

      const result = testSpec.build();
      const notResult = result.not();

      // Test with valid user (should fail because original would succeed)
      const validResult = notResult.satisfy(validUser);
      expect(unwrap(validResult)).toEqual('Specification should not be satisfied');

      // Test with invalid user (should succeed because original would fail)
      const invalidResult = notResult.satisfy(invalidUser);
      expect(unwrap(invalidResult)).toEqual('Specification should not be satisfied');
    });

    it('should handle spec() build() makeSpec with fallback documentation', () => {
      // Test the makeSpec function's fallback logic for documentation
      const testSpec = spec<User>(undefined, (u) => u.role === 'Admin', [
        rule('test rule', (u) => (u.age >= 18 ? ok(u) : err('INVALID_AGE'))),
      ]);

      const result = testSpec.build();
      expect(result._tag).toBe('Specification');
      expect(result._doc).toBe('test rule'); // Should use first rule's documentation
    });

    it('should handle spec() build() makeSpec with no rules', () => {
      // Test the makeSpec function when there are no rules
      const testSpec = spec<User>(undefined, (u) => u.role === 'Admin', []);

      const result = testSpec.build();
      expect(result._tag).toBe('Specification');
      expect(result._doc).toBeUndefined(); // Should be undefined when no rules
    });

    it('should handle specWithRules rule() with documented rule', () => {
      // Test the specWithRules rule() method with documented rule
      const testSpec = spec<User>()
        .when((u) => u.role === 'Admin')
        .rule('test rule', (u) => (u.age >= 18 ? ok(u) : err('INVALID_AGE')))
        .build();

      expect(testSpec._tag).toBe('Specification');
      expect(testSpec._doc).toBe('test rule');

      // Test with valid user
      const validResult = testSpec.satisfy(validUser);
      expect(unwrap(validResult)).toEqual(validUser);

      // Test with invalid user
      const userWithAdminRole: User = { ...invalidUser, role: 'Admin' };
      const invalidResult = testSpec.satisfy(userWithAdminRole);
      expect(unwrap(invalidResult)).toEqual('INVALID_AGE');
    });

    it('should handle specWithRules rule() with predefined rule', () => {
      // Test the specWithRules rule() method with predefined rule
      const predefinedRule = rule('predefined rule', (u: User) =>
        u.name.length > 0 ? ok(u) : err('EMPTY_NAME'),
      );

      const testSpec = spec<User>()
        .when((u) => u.role === 'Admin')
        .rule(predefinedRule)
        .build();

      expect(testSpec._tag).toBe('Specification');
      expect(testSpec._doc).toBe('predefined rule');

      // Test with valid user
      const validResult = testSpec.satisfy(validUser);
      expect(unwrap(validResult)).toEqual(validUser);

      // Test with invalid user
      const userWithAdminRole: User = { ...invalidUser, role: 'Admin' };
      const invalidResult = testSpec.satisfy(userWithAdminRole);
      expect(unwrap(invalidResult)).toEqual('EMPTY_NAME');
    });

    it('should handle multiple rule additions in specWithRules', () => {
      // Test adding multiple rules in specWithRules
      const testSpec = spec<User>()
        .when((u) => u.role === 'Admin')
        .rule('first rule', (u) => (u.age >= 18 ? ok(u) : err('INVALID_AGE')))
        .rule('second rule', (u) => (u.name.length > 0 ? ok(u) : err('EMPTY_NAME')))
        .build();

      expect(testSpec._tag).toBe('Specification');
      expect(testSpec._doc).toBe('first rule'); // Should use first rule's documentation

      // Test with valid user
      const validResult = testSpec.satisfy(validUser);
      expect(unwrap(validResult)).toEqual(validUser);

      // Test with invalid user (should fail on first rule)
      const userWithAdminRole: User = { ...invalidUser, role: 'Admin' };
      const invalidResult = testSpec.satisfy(userWithAdminRole);
      expect(unwrap(invalidResult)).toEqual('INVALID_AGE');
    });

    it('should handle specWithRules build() with condition that fails', () => {
      // Test specWithRules build() when condition fails
      const testSpec = spec<User>()
        .when((u) => u.role === 'Admin')
        .rule('test rule', (u) => (u.age >= 18 ? ok(u) : err('INVALID_AGE')))
        .build();

      // Test with user that doesn't meet condition
      const result = testSpec.satisfy(invalidUser);
      expect(unwrap(result)).toEqual(invalidUser); // Should be satisfied because condition fails
    });

    it('should handle specWithRules build() with empty rules', () => {
      // Test specWithRules build() with empty rules
      const testSpec = spec<User>()
        .when((u) => u.role === 'Admin')
        .build();

      expect(testSpec._tag).toBe('Specification');

      // Test with valid user
      const validResult = testSpec.satisfy(validUser);
      expect(unwrap(validResult)).toEqual(validUser);

      // Test with invalid user
      const invalidResult = testSpec.satisfy(invalidUser);
      expect(unwrap(invalidResult)).toEqual(invalidUser); // Condition fails, so satisfied
    });

    it('should handle specWithRules build() with no condition', () => {
      // Test specWithRules build() with no condition
      const testSpec = spec<User>()
        .when(() => true)
        .rule('test rule', (u) => (u.age >= 18 ? ok(u) : err('INVALID_AGE')))
        .build();

      expect(testSpec._tag).toBe('Specification');

      // Test with valid user
      const validResult = testSpec.satisfy(validUser);
      expect(unwrap(validResult)).toEqual(validUser);

      // Test with invalid user
      const invalidResult = testSpec.satisfy(invalidUser);
      expect(unwrap(invalidResult)).toEqual('INVALID_AGE');
    });

    it('should cover the isErr(r1) branch in builder and()', () => {
      // Create a base spec with a rule that always fails.
      const alwaysFailSpec = spec<User>()
        .when(() => true)
        .rule('fail', () => err('ALWAYS_FAIL'))
        .build();
      // Create a spec that always passes.
      const alwaysPassSpec = spec<User>()
        .when(() => true)
        .rule('pass', () => ok(validUser))
        .build();
      // Use the base builder to combine with and().
      const combined = alwaysFailSpec.and(alwaysPassSpec);
      const result = combined.satisfy(validUser);
      expect(unwrap(result)).toEqual('ALWAYS_FAIL'); // Should return the error of the first spec.
    });

    it('should cover the isOk(r) branch in builder not()', () => {
      // Create an empty base spec (always returns ok).
      const emptySpec = spec<User>().build();
      // Apply not() over the base builder.
      const notSpec = emptySpec.not();
      const result = notSpec.satisfy(validUser);
      expect(unwrap(result)).toEqual('Specification should not be satisfied');
    });
  });
});
