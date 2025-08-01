import { err, isErr, isOk, ok, unwrap } from '../src/result';
import { condition, spec } from '../src/specification';
import { traceInfo } from '../src/trace';

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

/**
 * spec-001: Basic specification with automatic type inference.
 */
function specBasicSpecification() {
  console.log('\nspec-001: Basic specification with automatic type inference.');

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
    console.log('Logic when specification is satisfied:', unwrap(result));
  } else {
    console.log('Error:', unwrap(result));
  }
}

/**
 * spec-002: Complex specification with multiple conditions and error accumulation.
 */
function specComplexSpecification() {
  console.log('\nspec-002: Complex specification with multiple conditions and error accumulation.');

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
  console.log('Valid user result:', unwrap(result));

  const errorResult = userValidationSpec.satisfy(invalidUser);
  console.log('Invalid user result:', unwrap(errorResult));
}

/**
 * spec-003: Combining specifications with AND logic.
 */
function specCombiningSpecificationsWithAndLogic() {
  console.log('\nspec-003: Combining specifications with AND logic.');

  const adminSpec = spec(condition((u: User) => (u.role === 'Admin' ? ok(u) : err('NOT_ADMIN'))));

  const emailSpec = spec(
    condition((u: User) => (u.email.endsWith('@company.com') ? ok(u) : err('INVALID_EMAIL'))),
  );

  const combinedSpec = adminSpec.and(emailSpec);
  const result = combinedSpec.satisfy(validUser);
  if (isErr(result)) {
    console.log('Error result:', unwrap(result)); // 'NOT_ADMIN' | 'INVALID_EMAIL'.
  } else {
    console.log('Success result:', unwrap(result)); // user object (when both specs are satisfied).
  }
}

/**
 * spec-004: Combining specifications with OR logic.
 */
function specCombiningSpecificationsWithOrLogic() {
  console.log('\nspec-004: Combining specifications with OR logic.');

  const adminSpec = spec(condition((u: User) => (u.role === 'Admin' ? ok(u) : err('NOT_ADMIN'))));

  const userSpec = spec(condition((u: User) => (u.role === 'User' ? ok(u) : err('NOT_USER'))));

  const combinedSpec = adminSpec.or(userSpec);
  const result = combinedSpec.satisfy(validUser);
  if (isOk(result)) {
    console.log('Success result:', unwrap(result)); // user object (when at least one spec is satisfied).
  } else {
    console.log('Error result:', unwrap(result)); // 'NOT_ADMIN' | 'NOT_USER' (when both specs fail).
  }
}

/**
 * spec-005: Negating a specification with custom error.
 */
function specNegatingASpecificationWithCustomError() {
  console.log('\nspec-005: Negating a specification with custom error.');

  const adminSpec = spec(condition((u: User) => (u.role === 'Admin' ? ok(u) : err('NOT_ADMIN'))));

  const notAdminSpec = adminSpec.not('USER_MUST_NOT_BE_ADMIN');
  const result = notAdminSpec.satisfy(validUser);
  if (isErr(result)) {
    console.log('Error result:', unwrap(result)); // 'USER_MUST_NOT_BE_ADMIN'.
  } else {
    console.log('Success result:', unwrap(result)); // user object (when user is not admin).
  }
}

/**
 * spec-006: Condition with metadata.
 */
function specConditionWithMetadata() {
  console.log('\nspec-006: Condition with metadata.');

  const hasPermission = condition((user: User) =>
    user.permissions.includes('manage_users') ? ok(user) : err('NO_PERMISSION'),
  ).meta({
    scope: 'user',
    name: 'hasManageUsersPermission',
    description: 'A user must have the manage users permission',
  });

  const metadata = traceInfo(hasPermission);
  console.log('Element ID:', metadata?.id);
  console.log('Element Tag:', metadata?.tag);
  console.log('Element Hash:', metadata?.hash);
  // All metadata is now accessible through traceInfo function.
}

// Execute all examples
specBasicSpecification();
specComplexSpecification();
specCombiningSpecificationsWithAndLogic();
specCombiningSpecificationsWithOrLogic();
specNegatingASpecificationWithCustomError();
specConditionWithMetadata();
