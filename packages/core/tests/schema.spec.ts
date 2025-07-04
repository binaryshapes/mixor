import { describe, expect, expectTypeOf, it } from 'vitest';

import { err, ok, unwrap } from '../src/result';
import { type InferSchema, schema } from '../src/schema';

describe('schema', () => {
  describe('Basic functionality', () => {
    it('should create a schema builder with field validators', () => {
      const userSchema = schema({
        name: (value: string) => (value.length > 0 ? ok(value) : err('EMPTY_NAME')),
        age: (value: number) => (value >= 0 ? ok(value) : err('INVALID_AGE')),
      });

      expect(userSchema).toBeDefined();
      expect(userSchema.fields).toBeDefined();
      expect(typeof userSchema.build).toBe('function');
    });

    it('should build a validator function', () => {
      const userSchema = schema({
        name: (value: string) => (value.length > 0 ? ok(value) : err('EMPTY_NAME')),
        age: (value: number) => (value >= 0 ? ok(value) : err('INVALID_AGE')),
      });

      const validator = userSchema.build();

      expect(typeof validator).toBe('function');
    });
  });

  describe('Validation modes', () => {
    it('should validate with all mode (default)', () => {
      const userSchema = schema({
        name: (value: string) => (value.length > 0 ? ok(value) : err('EMPTY_NAME')),
        email: (value: string) => (value.includes('@') ? ok(value) : err('INVALID_EMAIL')),
        age: (value: number) => (value >= 0 ? ok(value) : err('INVALID_AGE')),
      });

      const validator = userSchema.build();

      // Valid data.
      const validResult = validator({ name: 'John', email: 'john@example.com', age: 30 });
      expect(unwrap(validResult)).toEqual({ name: 'John', email: 'john@example.com', age: 30 });

      // Invalid data - all mode (default).
      const invalidResult = validator({ name: '', email: 'invalid', age: -5 });
      expect(unwrap(invalidResult)).toEqual({
        name: 'EMPTY_NAME',
        email: 'INVALID_EMAIL',
        age: 'INVALID_AGE',
      });
    });

    it('should validate with strict mode', () => {
      const userSchema = schema({
        name: (value: string) => (value.length > 0 ? ok(value) : err('EMPTY_NAME')),
        email: (value: string) => (value.includes('@') ? ok(value) : err('INVALID_EMAIL')),
        age: (value: number) => (value >= 0 ? ok(value) : err('INVALID_AGE')),
      });

      const validator = userSchema.build();

      // Strict mode - stops at first error.
      const strictResult = validator({ name: '', email: 'invalid', age: -5 }, { mode: 'strict' });
      expect(unwrap(strictResult)).toEqual({ name: 'EMPTY_NAME' });
    });

    it('should validate successfully with strict mode when all fields are valid', () => {
      const userSchema = schema({
        name: (value: string) => (value.length > 0 ? ok(value) : err('EMPTY_NAME')),
        email: (value: string) => (value.includes('@') ? ok(value) : err('INVALID_EMAIL')),
        age: (value: number) => (value >= 0 ? ok(value) : err('INVALID_AGE')),
      });

      const validator = userSchema.build();

      // Strict mode - all fields valid.
      const strictResult = validator(
        { name: 'John', email: 'john@example.com', age: 30 },
        { mode: 'strict' },
      );
      expect(unwrap(strictResult)).toEqual({ name: 'John', email: 'john@example.com', age: 30 });
    });

    it('should validate with all mode explicitly', () => {
      const userSchema = schema({
        name: (value: string) => (value.length > 0 ? ok(value) : err('EMPTY_NAME')),
        email: (value: string) => (value.includes('@') ? ok(value) : err('INVALID_EMAIL')),
        age: (value: number) => (value >= 0 ? ok(value) : err('INVALID_AGE')),
      });

      const validator = userSchema.build();

      // All mode - collects all errors.
      const allResult = validator({ name: '', email: 'invalid', age: -5 }, { mode: 'all' });
      expect(unwrap(allResult)).toEqual({
        name: 'EMPTY_NAME',
        email: 'INVALID_EMAIL',
        age: 'INVALID_AGE',
      });
    });
  });

  describe('Complex validation', () => {
    it('should handle complex validation functions', () => {
      const passwordSchema = schema({
        password: (value: string) => {
          if (value.length < 8) return err('TOO_SHORT');
          if (!/[A-Z]/.test(value)) return err('NO_UPPERCASE');
          if (!/[a-z]/.test(value)) return err('NO_LOWERCASE');
          if (!/\d/.test(value)) return err('NO_NUMBER');
          return ok(value);
        },
        confirmPassword: (value: string) => {
          return value.length > 0 ? ok(value) : err('EMPTY_CONFIRMATION');
        },
      });

      const validator = passwordSchema.build();

      const result = validator(
        {
          password: 'weak',
          confirmPassword: '',
        },
        { mode: 'all' },
      );

      expect(unwrap(result)).toEqual({
        password: 'TOO_SHORT',
        confirmPassword: 'EMPTY_CONFIRMATION',
      });
    });
  });

  describe('Type inference', () => {
    it('should correctly infer schema types', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const userSchema = schema({
        name: (value: string) => (value.length > 0 ? ok(value) : err('EMPTY_NAME')),
        age: (value: number) => (value >= 0 ? ok(value) : err('INVALID_AGE')),
      });

      // Infer the expected input type.
      type UserInput = InferSchema<typeof userSchema>;
      // Typechecking.
      expectTypeOf({} as UserInput).toEqualTypeOf<{ name: string; age: number }>();
    });
  });

  describe('Code examples', () => {
    it('should handle basic usage example from documentation', () => {
      // Basic user schema with string and number validation.
      const userSchema = schema({
        name: (value: string) => (value.length > 0 ? ok(value) : err('EMPTY_NAME')),
        age: (value: number) => (value >= 0 ? ok(value) : err('INVALID_AGE')),
      });

      const validator = userSchema.build();

      // Valid data.
      const validResult = validator({ name: 'John', age: 30 });
      expect(unwrap(validResult)).toEqual({ name: 'John', age: 30 });

      // Invalid data - all mode (default).
      const invalidResult = validator({ name: '', age: -5 });
      expect(unwrap(invalidResult)).toEqual({ name: 'EMPTY_NAME', age: 'INVALID_AGE' });
    });

    it('should handle different validation modes example from documentation', () => {
      // Schema with different validation modes.
      const userSchema = schema({
        name: (value: string) => (value.length > 0 ? ok(value) : err('EMPTY_NAME')),
        email: (value: string) => (value.includes('@') ? ok(value) : err('INVALID_EMAIL')),
        age: (value: number) => (value >= 0 ? ok(value) : err('INVALID_AGE')),
      });

      const validator = userSchema.build();

      // Strict mode - stops at first error.
      const strictResult = validator({ name: '', email: 'invalid', age: -5 }, { mode: 'strict' });
      expect(unwrap(strictResult)).toEqual({ name: 'EMPTY_NAME' });

      // All mode - collects all errors.
      const allResult = validator({ name: '', email: 'invalid', age: -5 }, { mode: 'all' });
      expect(unwrap(allResult)).toEqual({
        name: 'EMPTY_NAME',
        email: 'INVALID_EMAIL',
        age: 'INVALID_AGE',
      });
    });

    it('should handle complex validation functions example from documentation', () => {
      // Schema with complex validation functions.
      const passwordSchema = schema({
        password: (value: string) => {
          if (value.length < 8) return err('TOO_SHORT');
          if (!/[A-Z]/.test(value)) return err('NO_UPPERCASE');
          if (!/[a-z]/.test(value)) return err('NO_LOWERCASE');
          if (!/\d/.test(value)) return err('NO_NUMBER');
          return ok(value);
        },
        confirmPassword: (value: string) => {
          // This would need access to the original password field.
          // For now, just basic validation.
          return value.length > 0 ? ok(value) : err('EMPTY_CONFIRMATION');
        },
      });

      const validator = passwordSchema.build();

      const result = validator(
        {
          password: 'weak',
          confirmPassword: '',
        },
        { mode: 'all' },
      );

      expect(unwrap(result)).toEqual({
        password: 'TOO_SHORT',
        confirmPassword: 'EMPTY_CONFIRMATION',
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle empty schema', () => {
      const emptySchema = schema({});
      const validator = emptySchema.build();

      const result = validator({});
      expect(unwrap(result)).toEqual({});
    });

    it('should handle schema with single field', () => {
      const singleFieldSchema = schema({
        name: (value: string) => (value.length > 0 ? ok(value) : err('EMPTY_NAME')),
      });

      const validator = singleFieldSchema.build();

      // Valid.
      const validResult = validator({ name: 'John' });
      expect(unwrap(validResult)).toEqual({ name: 'John' });

      // Invalid.
      const invalidResult = validator({ name: '' });
      expect(unwrap(invalidResult)).toEqual({ name: 'EMPTY_NAME' });
    });

    it('should handle mixed success and error results in all mode', () => {
      const mixedSchema = schema({
        name: (value: string) => (value.length > 0 ? ok(value) : err('EMPTY_NAME')),
        age: (value: number) => (value >= 0 ? ok(value) : err('INVALID_AGE')),
        email: (value: string) => (value.includes('@') ? ok(value) : err('INVALID_EMAIL')),
      });

      const validator = mixedSchema.build();

      // Mixed results - name valid, age invalid, email valid.
      const mixedResult = validator({ name: 'John', age: -5, email: 'john@example.com' });
      expect(unwrap(mixedResult)).toEqual({ age: 'INVALID_AGE' });
    });
  });
});
