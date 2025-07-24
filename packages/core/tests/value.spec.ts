import { describe, expect, expectTypeOf, it } from 'vitest';

import { type Result, err, isErr, isOk, ok, unwrap } from '../src/result';
import { type Value, isValue, value } from '../src/value';

describe('Value', () => {
  describe('Basic functionality', () => {
    it('should create a value wrapper with a validation function', () => {
      const nameValue = value((name: string) => (name.length > 0 ? ok(name) : err('EMPTY_NAME')));

      expect(typeof nameValue).toBe('function');
      expect(nameValue.validator).toBeDefined();
      expect(typeof nameValue.validator).toBe('function');
    });

    it('should validate values correctly', () => {
      const ageValue = value((age: number) => (age >= 18 ? ok(age) : err('INVALID_AGE')));

      const validResult = ageValue(21);
      const invalidResult = ageValue(15);

      expect(isOk(validResult)).toBe(true);
      expect(unwrap(validResult)).toBe(21);

      expect(isErr(invalidResult)).toBe(true);
      expect(unwrap(invalidResult)).toBe('INVALID_AGE');
    });

    it('should provide access to the validator function', () => {
      const validator = (age: number) => (age >= 18 ? ok(age) : err('INVALID_AGE'));
      const ageValue = value(validator);

      expect(ageValue.validator).toBe(validator);
    });

    it('should work with documentation', () => {
      const ageValue = value('User age must be at least 18 years old', (age: number) =>
        age >= 18 ? ok(age) : err('INVALID_AGE'),
      );

      expect(typeof ageValue).toBe('function');
      expect(ageValue.validator).toBeDefined();
    });

    it('should handle complex validation logic', () => {
      const emailValue = value('Email address validation', (email: string) => {
        if (!email.includes('@')) return err('INVALID_EMAIL');
        if (email.length < 5) return err('EMAIL_TOO_SHORT');
        return ok(email);
      });

      const validEmail = emailValue('user@example.com');
      const invalidEmail = emailValue('invalid');

      expect(isOk(validEmail)).toBe(true);
      expect(unwrap(validEmail)).toBe('user@example.com');

      expect(isErr(invalidEmail)).toBe(true);
      expect(unwrap(invalidEmail)).toBe('INVALID_EMAIL');
    });
  });

  describe('Type safety', () => {
    it('should provide correct type inference for all public elements', () => {
      // Test value function
      expectTypeOf(value).toBeFunction();
      expectTypeOf(value((name: string) => ok(name))).toBeFunction();

      // Test isValue function
      expectTypeOf(isValue).toBeFunction();
      expectTypeOf(isValue({})).toBeBoolean();

      // Test Value type
      const testValue: Value<string, string> = value((name: string) => ok(name));
      expectTypeOf(testValue).toBeFunction();
      expectTypeOf(testValue.validator).toBeFunction();
    });

    it('should validate generic type constraints', () => {
      // Test generic value function
      expectTypeOf(value).toBeFunction();
      expectTypeOf(value((name: string) => ok(name))).toBeFunction();

      // Test with different types
      const numberValue = value((num: number) => (num > 0 ? ok(num) : err('NEGATIVE')));
      expectTypeOf(numberValue).toBeFunction();
      expectTypeOf(numberValue(5)).toEqualTypeOf<Result<number, 'NEGATIVE'>>();
    });

    it('should validate union and intersection types', () => {
      // Test union error types
      const nameValue = value((name: string) => (name.length > 0 ? ok(name) : err('EMPTY_NAME')));

      expectTypeOf(nameValue).toBeFunction();
      expectTypeOf(nameValue('test')).toEqualTypeOf<Result<string, 'EMPTY_NAME'>>();
    });
  });

  describe('Code examples', () => {
    it('should run example value-001: Basic value validation', () => {
      const nameValue = value((name: string) => (name.length > 0 ? ok(name) : err('EMPTY_NAME')));
      const result = nameValue('John');

      expect(isOk(result)).toBe(true);
      expect(unwrap(result)).toBe('John');
    });

    it('should run example value-002: Value validation with documentation', () => {
      const ageValue = value('User age must be at least 18 years old', (age: number) =>
        age >= 18 ? ok(age) : err('INVALID_AGE'),
      );
      const result = ageValue(21);

      expect(isOk(result)).toBe(true);
      expect(unwrap(result)).toBe(21);
    });

    it('should run example value-003: Complex value validation with multiple checks', () => {
      const emailValue = value('Email address validation', (email: string) => {
        if (!email.includes('@')) return err('INVALID_EMAIL');
        if (email.length < 5) return err('EMAIL_TOO_SHORT');
        return ok(email);
      });

      const validEmail = emailValue('user@example.com');
      const invalidEmail = emailValue('invalid');

      expect(isOk(validEmail)).toBe(true);
      expect(unwrap(validEmail)).toBe('user@example.com');

      expect(isErr(invalidEmail)).toBe(true);
      expect(unwrap(invalidEmail)).toBe('INVALID_EMAIL');
    });

    it('should run example value-004: Value validation with type safety and bounds', () => {
      const ageValue = value('Age validation with bounds', (age: number) => {
        if (age < 0) return err('NEGATIVE_AGE');
        if (age > 150) return err('AGE_TOO_HIGH');
        return ok(age);
      });

      const result = ageValue(25);

      expect(isOk(result)).toBe(true);
      expect(unwrap(result)).toBe(25);
    });

    it('should run example value-005: Value validation with custom error types', () => {
      const emailValue = value('Email format validation', (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email) ? ok(email) : err('INVALID_EMAIL_FORMAT');
      });

      const validEmail = emailValue('user@example.com');
      const invalidEmail = emailValue('invalid-email');

      expect(isOk(validEmail)).toBe(true);
      expect(unwrap(validEmail)).toBe('user@example.com');

      expect(isErr(invalidEmail)).toBe(true);
      expect(unwrap(invalidEmail)).toBe('INVALID_EMAIL_FORMAT');
    });

    it('should run example value-006: Check if a value is a value wrapper', () => {
      const ageValue = value((age: number) => (age >= 18 ? ok(age) : err('INVALID_AGE')));
      const isAgeValue = isValue(ageValue);

      expect(isAgeValue).toBe(true);
    });

    it('should run example value-007: Check if a regular function is not a value wrapper', () => {
      const regularFunction = (age: number) => (age >= 18 ? ok(age) : err('INVALID_AGE'));
      const isValueWrapper = isValue(regularFunction);

      expect(isValueWrapper).toBe(false);
    });

    it('should run example value-008: Check if other types are not value wrappers', () => {
      const string = 'hello';
      const number = 42;
      const object = { age: 18 };

      const isStringValue = isValue(string);
      const isNumberValue = isValue(number);
      const isObjectValue = isValue(object);

      expect(isStringValue).toBe(false);
      expect(isNumberValue).toBe(false);
      expect(isObjectValue).toBe(false);
    });
  });
});
