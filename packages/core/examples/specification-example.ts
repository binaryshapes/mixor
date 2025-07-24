import { err, isOk, ok, unwrap } from '../src/result';
import { isSpec, rule, spec } from '../src/specification';

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
    console.log('Logic when specification is satisfied:', unwrap(result));
  } else {
    console.log('Error:', unwrap(result));
  }
}

/**
 * spec-002: Complex specification with multiple rules and error accumulation.
 */
function specComplexSpecification() {
  console.log('\nspec-002: Complex specification with multiple rules and error accumulation.');

  const userValidationSpec = spec<User>()
    .when((u) => u.role === 'Admin')
    .rule('should have valid email', (u) => (u.email.includes('@') ? ok(u) : err('INVALID_EMAIL')))
    .rule('should have valid age', (u) => (u.age >= 18 ? ok(u) : err('INVALID_AGE')))
    .rule('should have valid name', (u) => (u.name.trim().length > 0 ? ok(u) : err('EMPTY_NAME')))
    .rule('should have admin permissions', (u) =>
      u.permissions.includes('manage_users') ? ok(u) : err('NO_ADMIN_PERMISSIONS'),
    )
    .build();

  // Type is automatically inferred as: Specification<User, "INVALID_EMAIL" | "INVALID_AGE" | "EMPTY_NAME" | "NO_ADMIN_PERMISSIONS">
  const result = userValidationSpec.satisfy(validUser);
  console.log('Valid user result:', unwrap(result));

  const errorResult = userValidationSpec.satisfy(invalidUser);
  console.log('Invalid user result:', unwrap(errorResult));
}

/**
 * spec-003: Basic rule creation without documentation.
 */
function specBasicRuleCreation() {
  console.log('\nspec-003: Basic rule creation without documentation.');

  const hasPermission = rule((user: User) =>
    user.permissions.includes('manage_users') ? ok(user) : err('NO_PERMISSION'),
  );

  const result = hasPermission(validUser);
  console.log('Result:', unwrap(result));
  // ok(user) or err('NO_PERMISSION').
}

/**
 * spec-004: Rule creation with documentation.
 */
function specRuleCreationWithDocumentation() {
  console.log('\nspec-004: Rule creation with documentation.');

  const hasPermission = rule('User must have management permission', (user: User) =>
    user.permissions.includes('manage_users') ? ok(user) : err('NO_PERMISSION'),
  );

  console.log('Rule documentation:', hasPermission._doc); // 'User must have management permission'.
}

/**
 * spec-005: Checking if a value is a specification.
 */
function specCheckingIfValueIsSpecification() {
  console.log('\nspec-005: Checking if a value is a specification.');

  const adminSpec = spec<User>()
    .rule('admin permission', (u) =>
      u.permissions.includes('manage_users') ? ok(u) : err('NO_PERMISSION'),
    )
    .build();

  const isValidSpec = isSpec(adminSpec); // true.
  const isNotSpec = isSpec({}); // false.

  console.log('Is valid spec:', isValidSpec);
  console.log('Is not spec:', isNotSpec);
}

// Execute all examples
specBasicSpecification();
specComplexSpecification();
specBasicRuleCreation();
specRuleCreationWithDocumentation();
specCheckingIfValueIsSpecification();
