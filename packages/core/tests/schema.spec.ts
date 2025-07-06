import { describe, expect, expectTypeOf, it } from 'vitest';

import type { Any } from '../src/generics';
import { err, isOk, ok, unwrap } from '../src/result';
import { type InferSchema, type Schema, SchemaError, schema } from '../src/schema';
import { type Value, value } from '../src/value';

// Common functions.
const nameValidator = (value: string) => (value.length > 0 ? ok(value) : err('EMPTY_NAME'));
const ageValidator = (value: number) => (value >= 0 ? ok(value) : err('INVALID_AGE'));
const emailValidator = (value: string) => (value.includes('@') ? ok(value) : err('INVALID_EMAIL'));
const passwordValidator = (value: string) => {
  if (value.length < 8) return err('TOO_SHORT');
  if (!/[A-Z]/.test(value)) return err('NO_UPPERCASE');
  if (!/[a-z]/.test(value)) return err('NO_LOWERCASE');
  if (!/\d/.test(value)) return err('NO_NUMBER');
  return ok(value);
};

describe('schema', () => {
  describe('Basic functionality', () => {
    it('should create a schema with field validators', () => {
      const user = schema({
        name: value(nameValidator),
        age: value(ageValidator),
      });

      expect(user).toBeDefined();
      expectTypeOf(user.name).toBeFunction();
      expectTypeOf(user.age).toBeFunction();

      // Typechecking.
      expectTypeOf(user).toEqualTypeOf<
        Schema<{ name: Value<string, 'EMPTY_NAME'>; age: Value<number, 'INVALID_AGE'> }>
      >();
    });

    it('should return a function that validates the entire object', () => {
      const user = schema({
        name: value(nameValidator),
        age: value(ageValidator),
      });

      expectTypeOf(user).toBeFunction();
      expectTypeOf(user.name).toBeFunction();
      expectTypeOf(user.age).toBeFunction();

      // Typechecking.
      expectTypeOf(user).toEqualTypeOf<
        Schema<{ name: Value<string, 'EMPTY_NAME'>; age: Value<number, 'INVALID_AGE'> }>
      >();
    });
  });

  describe('Validation modes', () => {
    it('should validate with all mode (default)', () => {
      const user = schema({
        name: value(nameValidator),
        email: value(emailValidator),
        age: value(ageValidator),
      });

      // Valid data.
      const validResult = user({ name: 'John', email: 'john@example.com', age: 30 });
      expect(unwrap(validResult)).toEqual({ name: 'John', email: 'john@example.com', age: 30 });

      // Invalid data - all mode (default).
      const invalidResult = user({ name: '', email: 'invalid', age: -5 });
      expect(unwrap(invalidResult)).toEqual({
        name: 'EMPTY_NAME',
        email: 'INVALID_EMAIL',
        age: 'INVALID_AGE',
      });
    });

    it('should validate with strict mode', () => {
      const user = schema({
        name: value(nameValidator),
        email: value(emailValidator),
        age: value(ageValidator),
      });

      // Strict mode - stops at first error.
      const strictResult = user({ name: '', email: 'invalid', age: -5 }, { mode: 'strict' });
      expect(unwrap(strictResult)).toEqual({ name: 'EMPTY_NAME' });
    });

    it('should validate successfully with strict mode when all fields are valid', () => {
      const user = schema({
        name: value(nameValidator),
        email: value(emailValidator),
        age: value(ageValidator),
      });

      // Strict mode - all fields valid.
      const strictResult = user(
        { name: 'John', email: 'john@example.com', age: 30 },
        { mode: 'strict' },
      );
      expect(unwrap(strictResult)).toEqual({ name: 'John', email: 'john@example.com', age: 30 });
    });

    it('should validate with all mode explicitly', () => {
      const user = schema({
        name: value(nameValidator),
        email: value(emailValidator),
        age: value(ageValidator),
      });

      // All mode - collects all errors.
      const allResult = user({ name: '', email: 'invalid', age: -5 }, { mode: 'all' });
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
        password: value(passwordValidator),
        confirmPassword: value((value: string) =>
          value.length > 0 ? ok(value) : err('EMPTY_CONFIRMATION'),
        ),
      });

      const result = passwordSchema(
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
      const user = schema({
        name: value(nameValidator),
        age: value(ageValidator),
      });

      // Infer the expected input type.
      type UserInput = InferSchema<typeof user>;
      // Typechecking.
      expectTypeOf({} as UserInput).toEqualTypeOf<{ name: string; age: number }>();
    });

    it('should handle InferSchema example from documentation', () => {
      // Define a schema.
      const user = schema({
        name: value((value: string) => (value.length > 0 ? ok(value) : err('EMPTY_NAME'))),
        age: value((value: number) => (value >= 0 ? ok(value) : err('INVALID_AGE'))),
      });

      // Infer the expected input type.
      type UserInput = InferSchema<typeof user>;
      // type UserInput = { name: string; age: number }.

      // Use the inferred type.
      const validateUser = (data: UserInput) => {
        return user(data);
      };

      const result = validateUser({ name: 'John', age: 30 });
      expect(unwrap(result)).toEqual({ name: 'John', age: 30 });

      // Typechecking.
      expectTypeOf(user).toBeObject();
      expectTypeOf(validateUser).toBeFunction();
      expectTypeOf(validateUser).parameter(0).toEqualTypeOf<UserInput>();
      expectTypeOf(result).toEqualTypeOf<ReturnType<typeof validateUser>>();
    });
  });

  describe('Code examples', () => {
    it('should handle basic usage example from documentation', () => {
      // Basic schema creation and usage.
      const user = schema({
        name: value((value: string) => (value.length > 0 ? ok(value) : err('EMPTY_NAME'))),
        age: value((value: number) => (value >= 0 ? ok(value) : err('INVALID_AGE'))),
      });

      // Validate entire object.
      const validUser = user({ name: 'John Doe', age: 30 });
      expect(unwrap(validUser)).toEqual({ name: 'John Doe', age: 30 });

      // Validate individual fields.
      const userName = user.name('John Doe');
      const userAge = user.age(30);
      expect(unwrap(userName)).toEqual('John Doe');
      expect(unwrap(userAge)).toEqual(30);

      // Typechecking.
      expectTypeOf(user).toBeObject();
      expectTypeOf(user).toBeFunction();
      expectTypeOf(validUser).toEqualTypeOf<ReturnType<typeof user>>();
    });

    it('should handle schema with documentation example from documentation', () => {
      // Schema with documentation.
      const user = schema('User validation schema with name and age fields', {
        name: value((value: string) => (value.length > 0 ? ok(value) : err('EMPTY_NAME'))),
        age: value((value: number) => (value >= 0 ? ok(value) : err('INVALID_AGE'))),
      });

      expect(user.doc).toBe('User validation schema with name and age fields');

      // Typechecking.
      expectTypeOf(user).toBeObject();
      expectTypeOf(user).toBeFunction();
    });

    it('should handle schema with different validation modes example from documentation', () => {
      // Schema with different validation modes.
      const user = schema({
        name: value((value: string) => (value.length > 0 ? ok(value) : err('EMPTY_NAME'))),
        email: value((value: string) => (value.includes('@') ? ok(value) : err('INVALID_EMAIL'))),
        age: value((value: number) => (value >= 0 ? ok(value) : err('INVALID_AGE'))),
      });

      // All mode (default) - collects all errors.
      const allErrors = user({ name: '', email: 'invalid', age: -5 });
      expect(unwrap(allErrors)).toEqual({
        name: 'EMPTY_NAME',
        email: 'INVALID_EMAIL',
        age: 'INVALID_AGE',
      });

      // Strict mode - stops at first error.
      const strictError = user({ name: '', email: 'invalid', age: -5 }, { mode: 'strict' });
      expect(unwrap(strictError)).toEqual({ name: 'EMPTY_NAME' });

      // Typechecking.
      expectTypeOf(user).toBeObject();
      expectTypeOf(user).toBeFunction();
      expectTypeOf(allErrors).toEqualTypeOf<ReturnType<typeof user>>();
      expectTypeOf(strictError).toEqualTypeOf<ReturnType<typeof user>>();
    });

    it('should handle schema with error handling example from documentation', () => {
      // Schema with error handling.
      const user = schema({
        name: value((value: string) => (value.length > 0 ? ok(value) : err('EMPTY_NAME'))),
        age: value((value: number) => (value >= 0 ? ok(value) : err('INVALID_AGE'))),
      });

      // Handle validation errors.
      const result = user({ name: '', age: -5 });
      expect(isOk(result)).toBe(false);
      if (!isOk(result)) {
        expect(unwrap(result)).toEqual({ name: 'EMPTY_NAME', age: 'INVALID_AGE' });
      }

      // Typechecking.
      expectTypeOf(user).toBeObject();
      expectTypeOf(user).toBeFunction();
      expectTypeOf(result).toEqualTypeOf<ReturnType<typeof user>>();
    });

    it('should handle schema with TypeScript type inference example from documentation', () => {
      // Schema with TypeScript type inference.
      const user = schema({
        name: value((value: string) => (value.length > 0 ? ok(value) : err('EMPTY_NAME'))),
        age: value((value: number) => (value >= 0 ? ok(value) : err('INVALID_AGE'))),
      });

      // TypeScript will enforce correct input types.
      type UserInput = InferSchema<typeof user>;
      // type UserInput = { name: string; age: number }.

      const validateUser = (data: UserInput) => user(data);
      const result = validateUser({ name: 'John', age: 30 });
      expect(unwrap(result)).toEqual({ name: 'John', age: 30 });

      // Typechecking.
      expectTypeOf(user).toBeObject();
      expectTypeOf(validateUser).toBeFunction();
      expectTypeOf(validateUser).parameter(0).toEqualTypeOf<UserInput>();
      expectTypeOf(result).toEqualTypeOf<ReturnType<typeof validateUser>>();
    });

    it('should handle complex schema with documentation example from documentation', () => {
      // Complex schema with documentation and multiple fields.
      const userProfile = schema(
        'Complete user profile validation with comprehensive field validation',
        {
          name: value((value: string) => (value.length > 0 ? ok(value) : err('EMPTY_NAME'))),
          email: value((value: string) => (value.includes('@') ? ok(value) : err('INVALID_EMAIL'))),
          age: value((value: number) => (value >= 0 ? ok(value) : err('INVALID_AGE'))),
          password: value((value: string) => {
            if (value.length < 8) return err('TOO_SHORT');
            if (!/[A-Z]/.test(value)) return err('NO_UPPERCASE');
            if (!/[a-z]/.test(value)) return err('NO_LOWERCASE');
            if (!/\d/.test(value)) return err('NO_NUMBER');
            return ok(value);
          }),
        },
      );

      const result = userProfile({
        name: 'John',
        email: 'john@example.com',
        age: 30,
        password: 'StrongP@ss123',
      });
      expect(unwrap(result)).toEqual({
        name: 'John',
        email: 'john@example.com',
        age: 30,
        password: 'StrongP@ss123',
      });

      // Typechecking.
      expectTypeOf(userProfile).toBeObject();
      expectTypeOf(userProfile).toBeFunction();
      expectTypeOf(result).toEqualTypeOf<ReturnType<typeof userProfile>>();
    });

    it('should handle type inference with complex schema example from documentation', () => {
      // Type inference with complex schema.
      const userProfile = schema({
        name: value((value: string) => (value.length > 0 ? ok(value) : err('EMPTY_NAME'))),
        email: value((value: string) => (value.includes('@') ? ok(value) : err('INVALID_EMAIL'))),
        age: value((value: number) => (value >= 0 ? ok(value) : err('INVALID_AGE'))),
        isActive: value((value: boolean) => ok(value)),
      });

      type UserProfileInput = InferSchema<typeof userProfile>;
      // type UserProfileInput = { name: string; email: string; age: number; isActive: boolean }.

      // Use the inferred type for type-safe validation.
      const validateUserProfile = (data: UserProfileInput) => userProfile(data);
      const result = validateUserProfile({
        name: 'John',
        email: 'john@example.com',
        age: 30,
        isActive: true,
      });
      expect(unwrap(result)).toEqual({
        name: 'John',
        email: 'john@example.com',
        age: 30,
        isActive: true,
      });

      // Typechecking.
      expectTypeOf(userProfile).toBeObject();
      expectTypeOf(validateUserProfile).toBeFunction();
      expectTypeOf(validateUserProfile).parameter(0).toEqualTypeOf<UserProfileInput>();
      expectTypeOf(result).toEqualTypeOf<ReturnType<typeof validateUserProfile>>();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty schema', () => {
      const emptySchema = schema({});

      const result = emptySchema({});
      expect(unwrap(result)).toEqual({});

      // Typechecking.
      expectTypeOf(emptySchema).toBeObject();
      expectTypeOf(emptySchema).toBeFunction();
      expectTypeOf(result).toEqualTypeOf<ReturnType<typeof emptySchema>>();
    });

    it('should handle schema with single field', () => {
      const singleFieldSchema = schema({
        name: value(nameValidator),
      });

      // Valid.
      const validResult = singleFieldSchema({ name: 'John' });
      expect(unwrap(validResult)).toEqual({ name: 'John' });

      // Invalid.
      const invalidResult = singleFieldSchema({ name: '' });
      expect(unwrap(invalidResult)).toEqual({ name: 'EMPTY_NAME' });

      // Typechecking.
      expectTypeOf(singleFieldSchema).toBeObject();
      expectTypeOf(singleFieldSchema).toBeFunction();
      expectTypeOf(validResult).toEqualTypeOf<ReturnType<typeof singleFieldSchema>>();
      expectTypeOf(invalidResult).toEqualTypeOf<ReturnType<typeof singleFieldSchema>>();
    });

    it('should handle mixed success and error results in all mode', () => {
      const mixedSchema = schema({
        name: value(nameValidator),
        age: value(ageValidator),
        email: value(emailValidator),
      });

      // Mixed results - name valid, age invalid, email valid.
      const mixedResult = mixedSchema({ name: 'John', age: -5, email: 'john@example.com' });
      expect(unwrap(mixedResult)).toEqual({ age: 'INVALID_AGE' });

      // Typechecking.
      expectTypeOf(mixedSchema).toBeObject();
      expectTypeOf(mixedSchema).toBeFunction();
      expectTypeOf(mixedResult).toEqualTypeOf<ReturnType<typeof mixedSchema>>();
    });
  });

  describe('Error handling', () => {
    it('should validate SchemaError type and structure', () => {
      // Create a SchemaError instance to validate its structure.
      const schemaError = new SchemaError('FIELD_IS_NOT_VALUE', 'Test error message');

      expectTypeOf(schemaError).toBeObject();
      expectTypeOf(schemaError.key).toBeString();
      expectTypeOf(schemaError.message).toBeString();
      expectTypeOf(schemaError.name).toBeString();

      expect(schemaError.key).toBe('SCHEMA:FIELD_IS_NOT_VALUE');
      expect(schemaError.message).toBe('Test error message');
      expect(schemaError.name).toBe('Panic');
    });

    it('should throw when a field is not a value wrapper (corrupt value)', () => {
      // Force a schema with a corrupt field (not wrapped in value).
      const corruptSchema = schema({
        name: value(nameValidator),
        age: ((value: number) => (value >= 0 ? ok(value) : err('INVALID_AGE'))) as Any, // corrupt.
      } as Any);

      expect(() => {
        corruptSchema({ name: 'John', age: 30 });
      }).toThrow(SchemaError);

      // Verify it's the correct error.
      try {
        corruptSchema({ name: 'John', age: 30 });
      } catch (error) {
        expect(error).toBeInstanceOf(SchemaError);
        expect((error as Any).key).toBe('SCHEMA:FIELD_IS_NOT_VALUE');
        expect((error as Any).message).toBe('Field "age" is not a value.');
      }

      // Typechecking.
      expectTypeOf(corruptSchema).toBeObject();
      expectTypeOf(corruptSchema).toBeFunction();
    });

    it('should throw when field is a primitive value (hacky test)', () => {
      // Schema with primitives as validators (very hacky).
      const primitiveSchema = schema({
        name: value(nameValidator),
        age: 'not a function' as Any, // string primitive.
      } as Any);

      expect(() => {
        primitiveSchema({ name: 'John', age: 30 });
      }).toThrow(SchemaError);

      // Verify it's the correct error.
      try {
        primitiveSchema({ name: 'John', age: 30 });
      } catch (error) {
        expect(error).toBeInstanceOf(SchemaError);
        expect((error as Any).key).toBe('SCHEMA:FIELD_IS_NOT_VALUE');
        expect((error as Any).message).toBe('Field "age" is not a value.');
      }

      // Typechecking.
      expectTypeOf(primitiveSchema).toBeObject();
      expectTypeOf(primitiveSchema).toBeFunction();
    });

    it('should throw when field is an object (hacky test)', () => {
      // Schema with objects as validators (very hacky).
      const objectSchema = schema({
        name: value(nameValidator),
        age: { fake: 'validator' } as Any, // object.
      } as Any);

      expect(() => {
        objectSchema({ name: 'John', age: 30 });
      }).toThrow(SchemaError);

      // Verify it's the correct error.
      try {
        objectSchema({ name: 'John', age: 30 });
      } catch (error) {
        expect(error).toBeInstanceOf(SchemaError);
        expect((error as Any).key).toBe('SCHEMA:FIELD_IS_NOT_VALUE');
        expect((error as Any).message).toBe('Field "age" is not a value.');
      }

      // Typechecking.
      expectTypeOf(objectSchema).toBeObject();
      expectTypeOf(objectSchema).toBeFunction();
    });

    it('should throw when field is an array (hacky test)', () => {
      // Schema with arrays as validators (very hacky).
      const arraySchema = schema({
        name: value(nameValidator),
        age: [1, 2, 3] as Any, // array.
      } as Any);

      expect(() => {
        arraySchema({ name: 'John', age: 30 });
      }).toThrow(SchemaError);

      // Verify it's the correct error.
      try {
        arraySchema({ name: 'John', age: 30 });
      } catch (error) {
        expect(error).toBeInstanceOf(SchemaError);
        expect((error as Any).key).toBe('SCHEMA:FIELD_IS_NOT_VALUE');
        expect((error as Any).message).toBe('Field "age" is not a value.');
      }

      // Typechecking.
      expectTypeOf(arraySchema).toBeObject();
      expectTypeOf(arraySchema).toBeFunction();
    });

    it('should throw when field is a hacked value with fake properties (hacky test)', () => {
      // Create an object that looks like a value but isn't.
      const fakeValue = ((value: number) => (value >= 0 ? ok(value) : err('INVALID_AGE'))) as Any;
      fakeValue._tag = 'Value'; // fake tag.
      fakeValue._hash = 'fake-hash'; // fake hash.
      fakeValue.validator = fakeValue; // fake validator.
      fakeValue.doc = 'fake documentation'; // fake doc.

      const hackedSchema = schema({
        name: value(nameValidator),
        age: fakeValue, // hacked value.
      } as Any);

      expect(() => {
        hackedSchema({ name: 'John', age: 30 });
      }).toThrow(SchemaError);

      // Verify it's the correct error.
      try {
        hackedSchema({ name: 'John', age: 30 });
      } catch (error) {
        expect(error).toBeInstanceOf(SchemaError);
        expect((error as Any).key).toBe('SCHEMA:FIELD_IS_NOT_VALUE');
        expect((error as Any).message).toBe('Field "age" is not a value.');
      }

      // Typechecking.
      expectTypeOf(hackedSchema).toBeObject();
      expectTypeOf(hackedSchema).toBeFunction();
    });

    it('should handle missing fields gracefully', () => {
      const user = schema({
        name: value(nameValidator),
        age: value(ageValidator),
      });

      // Missing age field should cause validation error.
      const result = user({ name: 'John' } as Any);
      expect(unwrap(result)).toEqual({ age: 'INVALID_AGE' });

      // Typechecking.
      expectTypeOf(user).toBeObject();
      expectTypeOf(user).toBeFunction();
      expectTypeOf(result).toEqualTypeOf<ReturnType<typeof user>>();
    });

    it('should handle extra fields gracefully', () => {
      const user = schema({
        name: value(nameValidator),
        age: value(ageValidator),
      });

      // Extra fields should be ignored.
      const result = user({
        name: 'John',
        age: 30,
        extraField: 'should be ignored',
      } as Any);
      expect(unwrap(result)).toEqual({ name: 'John', age: 30 });

      // Typechecking.
      expectTypeOf(user).toBeObject();
      expectTypeOf(user).toBeFunction();
      expectTypeOf(result).toEqualTypeOf<ReturnType<typeof user>>();
    });

    it('should handle null/undefined field values', () => {
      const user = schema({
        name: value((value: string | null | undefined) =>
          value && value.length > 0 ? ok(value) : err('EMPTY_NAME'),
        ),
        age: value((value: number | null | undefined) =>
          value !== null && value !== undefined && value >= 0 ? ok(value) : err('INVALID_AGE'),
        ),
      });

      // Null/undefined values should cause validation errors.
      const resultWithNull = user({ name: null, age: 30 } as Any);
      const resultWithUndefined = user({ name: 'John', age: undefined } as Any);

      expect(unwrap(resultWithNull)).toEqual({ name: 'EMPTY_NAME' });
      expect(unwrap(resultWithUndefined)).toEqual({ age: 'INVALID_AGE' });

      // Typechecking.
      expectTypeOf(user).toBeObject();
      expectTypeOf(user).toBeFunction();
      expectTypeOf(resultWithNull).toEqualTypeOf<ReturnType<typeof user>>();
      expectTypeOf(resultWithUndefined).toEqualTypeOf<ReturnType<typeof user>>();
    });
  });
});
