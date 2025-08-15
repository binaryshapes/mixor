import { describe, expect, expectTypeOf, it } from 'vitest';

import { type Result, err, isOk, ok, unwrap } from '../src/result';
import { SchemaError, isSchema, schema } from '../src/schema';
import { rule, value } from '../src/value';

describe('schema', () => {
  describe('Public API', () => {
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
      expect(UserSchema.info().tag).toBe('Schema');
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
      })
        .meta({
          name: 'UserSchema',
          description: 'User validation description',
          context: 'UserValidation',
          example: { name: 'John Doe', email: 'john@example.com' },
        })
        .traceable();

      expect(UserSchema.info().meta?.name).toBe('UserSchema');
      expect(UserSchema.info().meta?.description).toBe('User validation description');
      expect(UserSchema.info().meta?.context).toBe('UserValidation');
      expect(UserSchema.info().meta?.example).toEqual({
        name: 'John Doe',
        email: 'john@example.com',
      });
      expect(UserSchema.info().traceable).toBe(true);
    });
  });

  describe('Edge Cases & Error Handling', () => {
    it('should throw error for non-value fields', () => {
      expect(() => {
        schema({
          // @ts-expect-error - This is a test.
          name: 'not a value',
        });
      }).toThrow(SchemaError);
    });

    it('should handle empty schema object', () => {
      const EmptySchema = schema({});
      const result = EmptySchema({});
      expect(isOk(result)).toBe(true);
      expect(unwrap(result)).toEqual({});
    });

    it('should handle schema with single field', () => {
      const SingleFieldSchema = schema({
        name: value(rule((name: string) => (name.length > 0 ? ok(name) : err('EMPTY_NAME')))),
      });

      const validResult = SingleFieldSchema({ name: 'John' });
      expect(isOk(validResult)).toBe(true);
      expect(unwrap(validResult)).toEqual({ name: 'John' });

      const invalidResult = SingleFieldSchema({ name: '' });
      expect(isOk(invalidResult)).toBe(false);
      expect(unwrap(invalidResult)).toEqual({ name: ['EMPTY_NAME'] });
    });

    it('should handle nested validation errors in strict mode', () => {
      const UserSchema = schema({
        name: value(rule((name: string) => (name.length > 0 ? ok(name) : err('EMPTY_NAME')))),
        age: value(rule((age: number) => (age >= 0 ? ok(age) : err('INVALID_AGE')))),
        email: value(
          rule((email: string) => (email.includes('@') ? ok(email) : err('INVALID_EMAIL'))),
        ),
      });

      const result = UserSchema({ name: '', age: -5, email: 'invalid-email' }, 'strict');
      expect(isOk(result)).toBe(false);
      // Should return first error only in strict mode
      expect(Object.keys(unwrap(result))).toHaveLength(1);
    });

    it('should handle empty string and negative values gracefully', () => {
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
  });

  describe('Type Safety', () => {
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

    it('should validate return types for all public functions', () => {
      const UserSchema = schema({
        name: value(rule((name: string) => (name.length > 0 ? ok(name) : err('EMPTY_NAME')))),
        age: value(rule((age: number) => (age >= 0 ? ok(age) : err('INVALID_AGE')))),
      });

      // Test schema function return types
      expectTypeOf(UserSchema({ name: 'test', age: 25 })).toEqualTypeOf<
        Result<{ name: string; age: number }, { name: 'EMPTY_NAME'[]; age: 'INVALID_AGE'[] }>
      >();

      expectTypeOf(UserSchema({ name: 'test', age: 25 }, 'strict')).toEqualTypeOf<
        Result<{ name: string; age: number }, { name: 'EMPTY_NAME'; age: 'INVALID_AGE' }>
      >();

      // Test individual field function return types
      expectTypeOf(UserSchema.name('test')).toEqualTypeOf<Result<string, 'EMPTY_NAME'[]>>();

      expectTypeOf(UserSchema.age(25)).toEqualTypeOf<Result<number, 'INVALID_AGE'[]>>();
    });

    it('should validate type inference for schema values', () => {
      const UserSchema = schema({
        name: value(rule((name: string) => (name.length > 0 ? ok(name) : err('EMPTY_NAME')))),
        age: value(rule((age: number) => (age >= 0 ? ok(age) : err('INVALID_AGE')))),
        email: value(
          rule((email: string) => (email.includes('@') ? ok(email) : err('INVALID_EMAIL'))),
        ),
      });

      // Test schema values type inference
      expectTypeOf(UserSchema({ name: 'test', age: 25, email: 'test@example.com' })).toEqualTypeOf<
        Result<
          { name: string; age: number; email: string },
          { name: 'EMPTY_NAME'[]; age: 'INVALID_AGE'[]; email: 'INVALID_EMAIL'[] }
        >
      >();
    });

    it('should validate error mode type constraints', () => {
      const UserSchema = schema({
        name: value(rule((name: string) => (name.length > 0 ? ok(name) : err('EMPTY_NAME')))),
        age: value(rule((age: number) => (age >= 0 ? ok(age) : err('INVALID_AGE')))),
      });

      // Test that error mode parameter is properly typed
      expectTypeOf(UserSchema).toBeFunction();
      expectTypeOf(UserSchema({ name: 'test', age: 25 }, 'all')).toBeObject();
      expectTypeOf(UserSchema({ name: 'test', age: 25 }, 'strict')).toBeObject();
    });
  });
});
