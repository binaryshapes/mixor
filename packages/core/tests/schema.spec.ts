import { describe, expect, expectTypeOf, it } from 'vitest';

import { err, isOk, ok, unwrap } from '../src/result';
import { type InferSchema, SchemaError, isSchema, schema } from '../src/schema';
import { rule, value } from '../src/value';

describe('schema', () => {
  describe('Basic functionality', () => {
    it('should create a schema with field validators', () => {
      const NameValidator = value(
        rule((name: string) => (name.length > 0 ? ok(name) : err('EMPTY_NAME'))),
      );
      const AgeValidator = value(rule((age: number) => (age >= 0 ? ok(age) : err('INVALID_AGE'))));

      const UserSchema = schema({
        name: NameValidator,
        age: AgeValidator,
      });

      expect(isSchema(UserSchema)).toBe(true);
      expect(UserSchema['~trace'].tag).toBe('Schema');
    });

    it('should validate schema with valid data', () => {
      const UserSchema = schema({
        name: value(rule((name: string) => (name.length > 0 ? ok(name) : err('EMPTY_NAME')))),
        age: value(rule((age: number) => (age >= 0 ? ok(age) : err('INVALID_AGE')))),
      });

      const result = UserSchema({ name: 'John Doe', age: 30 });
      expect(isOk(result)).toBe(true);
      expect(unwrap(result)).toEqual({ name: 'John Doe', age: 30 });
    });

    it('should validate schema with invalid data in all mode', () => {
      const UserSchema = schema({
        name: value(rule((name: string) => (name.length > 0 ? ok(name) : err('EMPTY_NAME')))),
        age: value(rule((age: number) => (age >= 0 ? ok(age) : err('INVALID_AGE')))),
      });

      const result = UserSchema({ name: '', age: -5 });
      expect(isOk(result)).toBe(false);
      expect(unwrap(result)).toEqual({
        name: ['EMPTY_NAME'],
        age: ['INVALID_AGE'],
      });
    });

    it('should validate schema with invalid data in strict mode', () => {
      const UserSchema = schema({
        name: value(rule((name: string) => (name.length > 0 ? ok(name) : err('EMPTY_NAME')))),
        age: value(rule((age: number) => (age >= 0 ? ok(age) : err('INVALID_AGE')))),
      });

      const result = UserSchema({ name: '', age: -5 }, 'strict');
      expect(isOk(result)).toBe(false);
      expect(unwrap(result)).toEqual({
        name: 'EMPTY_NAME',
      });
    });

    it('should provide individual field validation', () => {
      const UserSchema = schema({
        name: value(rule((name: string) => (name.length > 0 ? ok(name) : err('EMPTY_NAME')))),
        age: value(rule((age: number) => (age >= 0 ? ok(age) : err('INVALID_AGE')))),
      });

      const nameResult = UserSchema.name('John Doe');
      expect(isOk(nameResult)).toBe(true);
      expect(unwrap(nameResult)).toBe('John Doe');

      const ageResult = UserSchema.age(25);
      expect(isOk(ageResult)).toBe(true);
      expect(unwrap(ageResult)).toBe(25);

      const invalidName = UserSchema.name('');
      expect(isOk(invalidName)).toBe(false);
      expect(unwrap(invalidName)).toEqual(['EMPTY_NAME']);
    });

    it('should support metadata and tracing', () => {
      const UserSchema = schema({
        name: value(rule((name: string) => (name.length > 0 ? ok(name) : err('EMPTY_NAME')))),
        email: value(
          rule((email: string) => (email.includes('@') ? ok(email) : err('INVALID_EMAIL'))),
        ),
      }).meta({
        name: 'UserSchema',
        description: 'User validation schema with name and email',
        scope: 'UserValidation',
        example: { name: 'John Doe', email: 'john@example.com' },
      });

      expect(UserSchema['~trace'].meta.name).toBe('UserSchema');
      expect(UserSchema['~trace'].meta.description).toBe(
        'User validation schema with name and email',
      );
      expect(UserSchema['~trace'].meta.scope).toBe('UserValidation');
      expect(UserSchema['~trace'].meta.example).toEqual({
        name: 'John Doe',
        email: 'john@example.com',
      });
    });

    it('should throw error for non-value fields', () => {
      expect(() => {
        schema({
          // @ts-expect-error - This is a test.
          name: 'not a value',
        });
      }).toThrow(SchemaError);
    });
  });

  describe('Type safety', () => {
    it('should provide correct type inference for all public elements', () => {
      // Test schema function
      expectTypeOf(schema).toBeFunction();
      expectTypeOf(schema({})).toBeFunction();

      // Test isSchema function
      expectTypeOf(isSchema).toBeFunction();
      expectTypeOf(isSchema({})).toBeBoolean();
    });

    it('should validate schema type constraints', () => {
      const UserSchema = schema({
        name: value(rule((name: string) => (name.length > 0 ? ok(name) : err('EMPTY_NAME')))),
        age: value(rule((age: number) => (age >= 0 ? ok(age) : err('INVALID_AGE')))),
      });

      // Test schema function signatures
      expectTypeOf(UserSchema).toBeFunction();
      expectTypeOf(UserSchema({ name: 'test', age: 25 })).toBeObject();
      expectTypeOf(UserSchema({ name: 'test', age: 25 }, 'strict')).toBeObject();

      // Test individual field functions
      expectTypeOf(UserSchema.name).toBeFunction();
      expectTypeOf(UserSchema.name('test')).toBeObject();
      expectTypeOf(UserSchema.age).toBeFunction();
      expectTypeOf(UserSchema.age(25)).toBeObject();
    });

    it('should validate InferSchema type inference', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const UserSchema = schema({
        name: value(rule((name: string) => (name.length > 0 ? ok(name) : err('EMPTY_NAME')))),
        age: value(rule((age: number) => (age >= 0 ? ok(age) : err('INVALID_AGE')))),
        email: value(
          rule((email: string) => (email.includes('@') ? ok(email) : err('INVALID_EMAIL'))),
        ),
      });

      type UserInput = InferSchema<typeof UserSchema>;
      expectTypeOf<UserInput>().toEqualTypeOf<{ name: string; age: number; email: string }>();
    });
  });

  describe('Code examples', () => {
    it('should run example schema-001: Basic schema creation and validation', () => {
      const NameNotEmpty = rule((name: string) => (name.length > 0 ? ok(name) : err('EMPTY_NAME')));
      const AgeValid = rule((age: number) => (age >= 0 ? ok(age) : err('INVALID_AGE')));

      const NameValidator = value(NameNotEmpty);
      const AgeValidator = value(AgeValid);

      const UserSchema = schema({
        name: NameValidator,
        age: AgeValidator,
      });

      const validUser = UserSchema({ name: 'John Doe', age: 30 });
      expect(isOk(validUser)).toBe(true);
      expect(unwrap(validUser)).toEqual({ name: 'John Doe', age: 30 });

      const invalidUser = UserSchema({ name: '', age: -5 });
      expect(isOk(invalidUser)).toBe(false);
      expect(unwrap(invalidUser)).toEqual({ name: ['EMPTY_NAME'], age: ['INVALID_AGE'] });
    });

    it('should run example schema-002: Individual field validation', () => {
      const NameValidator = value(
        rule((name: string) => (name.length > 0 ? ok(name) : err('EMPTY_NAME'))),
      );
      const AgeValidator = value(rule((age: number) => (age >= 0 ? ok(age) : err('INVALID_AGE'))));

      const UserSchema = schema({
        name: NameValidator,
        age: AgeValidator,
      });

      const nameResult = UserSchema.name('John Doe');
      expect(isOk(nameResult)).toBe(true);
      expect(unwrap(nameResult)).toBe('John Doe');

      const ageResult = UserSchema.age(25);
      expect(isOk(ageResult)).toBe(true);
      expect(unwrap(ageResult)).toBe(25);

      const invalidName = UserSchema.name('');
      expect(isOk(invalidName)).toBe(false);
      expect(unwrap(invalidName)).toEqual(['EMPTY_NAME']);
    });

    it('should run example schema-003: Schema with metadata and tracing', () => {
      const UserSchema = schema({
        name: value(rule((name: string) => (name.length > 0 ? ok(name) : err('EMPTY_NAME')))),
        email: value(
          rule((email: string) => (email.includes('@') ? ok(email) : err('INVALID_EMAIL'))),
        ),
      }).meta({
        name: 'UserSchema',
        description: 'User validation schema with name and email',
        scope: 'UserValidation',
        example: { name: 'John Doe', email: 'john@example.com' },
      });

      expect(UserSchema['~trace'].meta.name).toBe('UserSchema');
      expect(UserSchema['~trace'].meta.description).toBe(
        'User validation schema with name and email',
      );
      expect(UserSchema['~trace'].meta.scope).toBe('UserValidation');
      expect(UserSchema['~trace'].meta.example).toEqual({
        name: 'John Doe',
        email: 'john@example.com',
      });
      expect(UserSchema['~trace'].tag).toBe('Schema');
    });

    it('should run example schema-004: Strict vs All validation modes', () => {
      const UserSchema = schema({
        name: value(rule((name: string) => (name.length > 0 ? ok(name) : err('EMPTY_NAME')))),
        email: value(
          rule((email: string) => (email.includes('@') ? ok(email) : err('INVALID_EMAIL'))),
        ),
        age: value(rule((age: number) => (age >= 0 ? ok(age) : err('INVALID_AGE')))),
      });

      const invalidData = { name: '', email: 'invalid', age: -5 };

      const allErrors = UserSchema(invalidData, 'all');
      expect(isOk(allErrors)).toBe(false);
      expect(unwrap(allErrors)).toEqual({
        name: ['EMPTY_NAME'],
        email: ['INVALID_EMAIL'],
        age: ['INVALID_AGE'],
      });

      const strictError = UserSchema(invalidData, 'strict');
      expect(isOk(strictError)).toBe(false);
      expect(unwrap(strictError)).toEqual({
        name: 'EMPTY_NAME',
      });
    });

    it('should run example schema-005: Type inference with schema', () => {
      const UserSchema = schema({
        name: value(rule((name: string) => (name.length > 0 ? ok(name) : err('EMPTY_NAME')))),
        age: value(rule((age: number) => (age >= 0 ? ok(age) : err('INVALID_AGE')))),
        email: value(
          rule((email: string) => (email.includes('@') ? ok(email) : err('INVALID_EMAIL'))),
        ),
      });

      type UserInput = InferSchema<typeof UserSchema>;
      expectTypeOf<UserInput>().toEqualTypeOf<{ name: string; age: number; email: string }>();

      const validateUser = (data: UserInput) => UserSchema(data);
      expectTypeOf(validateUser).toBeFunction();
    });

    it('should run example schema-006: Check if object is a schema', () => {
      const UserSchema = schema({
        name: value(rule((name: string) => (name.length > 0 ? ok(name) : err('EMPTY_NAME')))),
      });

      const isUserSchema = isSchema(UserSchema);
      expect(isUserSchema).toBe(true);

      const isNotSchema = isSchema({ name: 'test' });
      expect(isNotSchema).toBe(false);
    });
  });
});
