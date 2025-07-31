import { err, ok } from '../src/result';
import { type InferSchema, isSchema, schema } from '../src/schema';
import { rule, value } from '../src/value';

/**
 * // schema-001: Basic schema creation and validation.
 */
function schemaBasicUsage() {
  console.log('\nschema-001: Basic schema creation and validation.');

  // Create validation rules
  const NameNotEmpty = rule((name: string) => (name.length > 0 ? ok(name) : err('EMPTY_NAME')));

  const AgeValid = rule((age: number) => (age >= 0 ? ok(age) : err('INVALID_AGE')));

  // Create value validators
  const NameValidator = value(NameNotEmpty);
  const AgeValidator = value(AgeValid);

  // Create schema
  const UserSchema = schema({
    name: NameValidator,
    age: AgeValidator,
  });

  // Test validation
  const validUser = UserSchema({ name: 'John Doe', age: 30 });
  console.log('Valid user result:', validUser);

  const invalidUser = UserSchema({ name: '', age: -5 });
  console.log('Invalid user result:', invalidUser);
}

/**
 * // schema-002: Individual field validation.
 */
function schemaIndividualFields() {
  console.log('\nschema-002: Individual field validation.');

  const NameValidator = value(
    rule((name: string) => (name.length > 0 ? ok(name) : err('EMPTY_NAME'))),
  );

  const AgeValidator = value(rule((age: number) => (age >= 0 ? ok(age) : err('INVALID_AGE'))));

  const UserSchema = schema({
    name: NameValidator,
    age: AgeValidator,
  });

  // Test individual fields
  const nameResult = UserSchema.name('John Doe');
  console.log('Name validation:', nameResult);

  const ageResult = UserSchema.age(25);
  console.log('Age validation:', ageResult);

  const invalidName = UserSchema.name('');
  console.log('Invalid name:', invalidName);
}

/**
 * // schema-003: Schema with metadata and tracing.
 */
function schemaWithMetadata() {
  console.log('\nschema-003: Schema with metadata and tracing.');

  const UserSchema = schema({
    name: value(rule((name: string) => (name.length > 0 ? ok(name) : err('EMPTY_NAME')))),
    email: value(rule((email: string) => (email.includes('@') ? ok(email) : err('INVALID_EMAIL')))),
  }).meta({
    name: 'UserSchema',
    description: 'User validation schema with name and email',
    scope: 'UserValidation',
    example: '{ "name": "John Doe", "email": "john@example.com" }',
  });

  console.log('Schema metadata:', UserSchema['~trace'].meta);
  console.log('Schema tag:', UserSchema['~trace'].tag);
}

/**
 * // schema-004: Strict vs All validation modes.
 */
function schemaValidationModes() {
  console.log('\nschema-004: Strict vs All validation modes.');

  const UserSchema = schema({
    name: value(rule((name: string) => (name.length > 0 ? ok(name) : err('EMPTY_NAME')))),
    email: value(rule((email: string) => (email.includes('@') ? ok(email) : err('INVALID_EMAIL')))),
    age: value(rule((age: number) => (age >= 0 ? ok(age) : err('INVALID_AGE')))),
  });

  const invalidData = { name: '', email: 'invalid', age: -5 };

  // All mode (default) - collects all errors
  const allErrors = UserSchema(invalidData, 'all');
  console.log('All errors mode:', allErrors);

  // Strict mode - stops at first error
  const strictError = UserSchema(invalidData, 'strict');
  console.log('Strict mode:', strictError);
}

/**
 * // schema-005: Type inference with schema.
 */
function schemaTypeInference() {
  console.log('\nschema-005: Type inference with schema.');

  const UserSchema = schema({
    name: value(rule((name: string) => (name.length > 0 ? ok(name) : err('EMPTY_NAME')))),
    age: value(rule((age: number) => (age >= 0 ? ok(age) : err('INVALID_AGE')))),
    email: value(rule((email: string) => (email.includes('@') ? ok(email) : err('INVALID_EMAIL')))),
  });

  type UserInput = InferSchema<typeof UserSchema>;
  console.log('Inferred type:', 'UserInput = { name: string; age: number; email: string }');

  // Use the inferred type for type-safe validation
  const validateUser = (data: UserInput) => UserSchema(data);

  // Demonstrate the type-safe validation function
  const testData: UserInput = { name: 'John', age: 30, email: 'john@example.com' };
  const validationResult = validateUser(testData);
  console.log('Type-safe validation function created and tested:', validationResult);
}

/**
 * // schema-006: Check if object is a schema.
 */
function schemaGuardCheck() {
  console.log('\nschema-006: Check if object is a schema.');

  const UserSchema = schema({
    name: value(rule((name: string) => (name.length > 0 ? ok(name) : err('EMPTY_NAME')))),
  });

  const isUserSchema = isSchema(UserSchema);
  console.log('Is UserSchema a schema:', isUserSchema);

  const isNotSchema = isSchema({ name: 'test' });
  console.log('Is plain object a schema:', isNotSchema);
}

// Execute all examples
schemaBasicUsage();
schemaIndividualFields();
schemaWithMetadata();
schemaValidationModes();
schemaTypeInference();
schemaGuardCheck();
