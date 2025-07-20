import { describe, expect, expectTypeOf, it } from 'vitest';

import { builder } from '../src/builder';
import type { Any } from '../src/generics';
import { err, ok, unwrap } from '../src/result';
import { type Value, isValue, value } from '../src/value';

// The password validator builder.
const passwordBuilder = builder({
  hasUppercase: (value: string) => (value.match(/[A-Z]/) ? ok(value) : err('NO_UPPERCASE')),
  hasLowercase: (value: string) => (value.match(/[a-z]/) ? ok(value) : err('NO_LOWERCASE')),
  hasNumber: (value: string) => (value.match(/\d/) ? ok(value) : err('NO_NUMBER')),
  hasSpecialChar: (value: string) =>
    value.match(/[!@#$%^&*(),.?":{}|<>]/) ? ok(value) : err('NO_SPECIAL_CHAR'),
  minLength: (min: number) => (value: string) =>
    value.length >= min ? ok(value) : err('TOO_SHORT'),
  maxLength: (max: number) => (value: string) =>
    value.length <= max ? ok(value) : err('TOO_LONG'),
});

// The password value validation rules.
const passwordValidator = passwordBuilder
  .hasUppercase()
  .hasLowercase()
  .hasNumber()
  .hasSpecialChar()
  .minLength(8)
  .maxLength(128);

describe('value', () => {
  describe('Basic functionality', () => {
    it('should create a value wrapper with a validation function', () => {
      const ageValue = value((age: number) => (age >= 18 ? ok(age) : err('INVALID_AGE')));

      expect(ageValue).toBeDefined();
      expect(typeof ageValue).toBe('function');
      expect(ageValue.validator).toBeDefined();
    });

    it('should validate values correctly', () => {
      const nameValue = value((name: string) => (name.length > 0 ? ok(name) : err('EMPTY_NAME')));

      const validResult = nameValue('John');
      const invalidResult = nameValue('');

      expect(unwrap(validResult)).toBe('John');
      expect(unwrap(invalidResult)).toBe('EMPTY_NAME');
    });

    it('should provide access to the validator function', () => {
      const validator = (age: number) => (age >= 18 ? ok(age) : err('INVALID_AGE'));
      const ageValue = value(validator);

      expect(ageValue.validator).toBe(validator);
    });

    it('should support optional description', () => {
      const ageValue = value('User age must be at least 18 years old', (age: number) =>
        age >= 18 ? ok(age) : err('INVALID_AGE'),
      );

      expect(ageValue._doc).toBe('User age must be at least 18 years old');
      expect(ageValue._tag).toBe('Value');

      const result = ageValue(21);
      expect(unwrap(result)).toBe(21);
    });

    it('should work without description', () => {
      const ageValue = value((age: number) => (age >= 18 ? ok(age) : err('INVALID_AGE')));

      expect(ageValue._doc).toBeUndefined();
      expect(ageValue._tag).toBe('Value');

      const result = ageValue(21);
      expect(unwrap(result)).toBe(21);
    });
  });

  describe('Complex validation', () => {
    it('should handle complex validation functions', () => {
      const emailValue = value((email: string) => {
        if (!email.includes('@')) return err('INVALID_EMAIL');
        if (email.length < 5) return err('EMAIL_TOO_SHORT');
        return ok(email);
      });

      const validEmail = emailValue('user@example.com');
      const invalidEmail = emailValue('invalid');
      const shortEmail = emailValue('a@b');

      expect(unwrap(validEmail)).toBe('user@example.com');
      expect(unwrap(invalidEmail)).toBe('INVALID_EMAIL');
      expect(unwrap(shortEmail)).toBe('EMAIL_TOO_SHORT');
    });

    it('should handle multiple validation conditions', () => {
      const ageValue = value((age: number) => {
        if (age < 0) return err('NEGATIVE_AGE');
        if (age > 150) return err('AGE_TOO_HIGH');
        return ok(age);
      });

      const validAge = ageValue(25);
      const negativeAge = ageValue(-5);
      const tooHighAge = ageValue(200);

      expect(unwrap(validAge)).toBe(25);
      expect(unwrap(negativeAge)).toBe('NEGATIVE_AGE');
      expect(unwrap(tooHighAge)).toBe('AGE_TOO_HIGH');
    });
  });

  describe('Type inference', () => {
    it('should correctly infer value types', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const ageValue = value((age: number) => (age >= 18 ? ok(age) : err('INVALID_AGE')));

      // Infer the expected input type.
      type AgeInput = typeof ageValue extends Value<infer T, Any> ? T : never;
      // Typechecking.
      expectTypeOf({} as AgeInput).toEqualTypeOf<number>();
    });

    it('should correctly infer error types', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const ageValue = value((age: number) => (age >= 18 ? ok(age) : err('INVALID_AGE')));

      // Infer the expected error type.
      type AgeError = typeof ageValue extends Value<Any, infer E> ? E : never;
      // Typechecking.
      expectTypeOf({} as AgeError).toEqualTypeOf<'INVALID_AGE'>();
    });

    it('should provide correct TypeScript types', () => {
      const nameValue = value((name: string) => (name.length > 0 ? ok(name) : err('EMPTY_NAME')));

      // Typechecking.
      expectTypeOf(nameValue).toBeFunction();
      expectTypeOf(nameValue).parameter(0).toBeString();
      expectTypeOf(nameValue).returns.toEqualTypeOf<ReturnType<typeof nameValue>>();
      expectTypeOf(nameValue.validator).toBeFunction();
    });
  });

  describe('Value guard', () => {
    it('should guard correctly a value', () => {
      const ageValue = value((age: number) => (age >= 18 ? ok(age) : err('INVALID_AGE')));

      if (isValue(ageValue)) {
        expect(ageValue).toBeDefined();
        expect(typeof ageValue).toBe('function');
        expect(ageValue.validator).toBeDefined();
        expect(ageValue._tag).toBe('Value');
      }
    });

    it('should guard correctly a value with doc', () => {
      const ageValue = value('User age must be at least 18 years old', (age: number) =>
        age >= 18 ? ok(age) : err('INVALID_AGE'),
      );

      if (isValue(ageValue)) {
        expect(ageValue).toBeDefined();
        expect(typeof ageValue).toBe('function');
        expect(ageValue.validator).toBeDefined();
        expect(ageValue._tag).toBe('Value');
        expect(ageValue._doc).toBe('User age must be at least 18 years old');
      }
    });

    it('should reject a function that is not a value', () => {
      const ageValue = (age: number) => (age >= 18 ? ok(age) : err('INVALID_AGE'));

      if (!isValue(ageValue)) {
        // @ts-expect-error - We expect the value to be a non-value.
        expect(ageValue.validator).toBeUndefined();

        // @ts-expect-error - We expect the value to be a non-value.
        expect(ageValue._tag).toBeUndefined();
      }
    });

    it('should reject a primitives, objects, arrays, etc.', () => {
      const string = '';
      const number = 18;
      const boolean = true;
      const object = { age: 18 };
      const array = [18];
      const nullValue = null;
      const undefinedValue = undefined;

      const r1 = isValue(string);
      const r2 = isValue(number);
      const r3 = isValue(boolean);
      const r4 = isValue(object);
      const r5 = isValue(array);
      const r6 = isValue(nullValue);
      const r7 = isValue(undefinedValue);

      expect(r1).toBe(false);
      expect(r2).toBe(false);
      expect(r3).toBe(false);
      expect(r4).toBe(false);
      expect(r5).toBe(false);
      expect(r6).toBe(false);
      expect(r7).toBe(false);

      if (!r1) {
        // @ts-expect-error - We expect the value to be a non-value.
        expect(string._tag).toBeUndefined();
        // @ts-expect-error - We expect the value to be a non-value.
        expect(string.validator).toBeUndefined();
      }

      if (!r2) {
        // @ts-expect-error - We expect the value to be a non-value.
        expect(number._tag).toBeUndefined();
        // @ts-expect-error - We expect the value to be a non-value.
        expect(number.validator).toBeUndefined();
      }

      if (!r3) {
        // @ts-expect-error - We expect the value to be a non-value.
        expect(boolean._tag).toBeUndefined();
        // @ts-expect-error - We expect the value to be a non-value.
        expect(boolean.validator).toBeUndefined();
      }

      if (!r4) {
        // @ts-expect-error - We expect the value to be a non-value.
        expect(object._tag).toBeUndefined();
        // @ts-expect-error - We expect the value to be a non-value.
        expect(object.validator).toBeUndefined();
      }

      if (!r5) {
        // @ts-expect-error - We expect the value to be a non-value.
        expect(array._tag).toBeUndefined();
        // @ts-expect-error - We expect the value to be a non-value.
        expect(array.validator).toBeUndefined();
      }
    });

    it('should reject a hacky `value` function', () => {
      const value = (value: number) => (value >= 18 ? ok(value) : err('INVALID_AGE'));
      value._doc = 'User age must be at least 18 years old';
      value._tag = 'Value';
      expect(isValue(value)).toBe(false);
    });
  });

  describe('Code examples', () => {
    it('should handle basic usage example from documentation', () => {
      // Basic value validation.
      const nameValue = value((name: string) => (name.length > 0 ? ok(name) : err('EMPTY_NAME')));

      const result = nameValue('John');

      expect(unwrap(result)).toBe('John');

      // Typechecking.
      expectTypeOf(value).toBeFunction();
      expectTypeOf(nameValue).toBeFunction();
      expectTypeOf(result).toEqualTypeOf<ReturnType<typeof nameValue>>();
    });

    it('should handle value validation with description example from documentation', () => {
      // Value validation with description.
      const ageValue = value('User age must be at least 18 years old', (age: number) =>
        age >= 18 ? ok(age) : err('INVALID_AGE'),
      );

      const result = ageValue(21);
      expect(unwrap(result)).toBe(21);
      expect(ageValue._doc).toBe('User age must be at least 18 years old');

      // Typechecking.
      expectTypeOf(ageValue).toBeFunction();
      expectTypeOf(ageValue).parameter(0).toBeNumber();
      expectTypeOf(result).toEqualTypeOf<ReturnType<typeof ageValue>>();
      expectTypeOf(ageValue._doc).toEqualTypeOf<string | undefined>();
    });

    it('should handle complex value validation example from documentation', () => {
      // Complex value validation.
      const emailValue = value('Email address validation', (email: string) => {
        if (!email.includes('@')) return err('INVALID_EMAIL');
        if (email.length < 5) return err('EMAIL_TOO_SHORT');
        return ok(email);
      });

      const validEmail = emailValue('user@example.com');
      const invalidEmail = emailValue('invalid');
      const shortEmail = emailValue('a@b');

      expect(unwrap(validEmail)).toBe('user@example.com');
      expect(unwrap(invalidEmail)).toBe('INVALID_EMAIL');
      expect(unwrap(shortEmail)).toBe('EMAIL_TOO_SHORT');

      // Typechecking.
      expectTypeOf(emailValue).toBeFunction();
      expectTypeOf(validEmail).toEqualTypeOf<ReturnType<typeof emailValue>>();
    });

    it('should handle value validation with type safety example from documentation', () => {
      // Value validation with type safety.
      const ageValue = value('Age validation with bounds', (age: number) => {
        if (age < 0) return err('NEGATIVE_AGE');
        if (age > 150) return err('AGE_TOO_HIGH');
        return ok(age);
      });

      // TypeScript will enforce the correct input type.
      const result = ageValue(25);

      expect(unwrap(result)).toBe(25);

      // Typechecking.
      expectTypeOf(ageValue).toBeFunction();
      expectTypeOf(ageValue).parameter(0).toBeNumber();
      expectTypeOf(result).toEqualTypeOf<ReturnType<typeof ageValue>>();
    });

    it('should handle value validation with custom error types example from documentation', () => {
      // Value validation with custom error types.
      const emailValue = value('Email format validation', (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email) ? ok(email) : err('INVALID_EMAIL_FORMAT');
      });

      const validEmail = emailValue('user@example.com');
      const invalidEmail = emailValue('invalid-email');

      expect(unwrap(validEmail)).toBe('user@example.com');
      expect(unwrap(invalidEmail)).toBe('INVALID_EMAIL_FORMAT');

      // Typechecking.
      expectTypeOf(emailValue).toBeFunction();
      expectTypeOf(validEmail).toEqualTypeOf<ReturnType<typeof emailValue>>();
      expectTypeOf(invalidEmail).toEqualTypeOf<ReturnType<typeof emailValue>>();
    });

    it('should handle integration with builder for password validation example from documentation', () => {
      // Integration with builder for password validation.
      const passwordBuilder = builder({
        hasUppercase: (value: string) => (/[A-Z]/.test(value) ? ok(value) : err('NO_UPPERCASE')),
        minLength: (min: number) => (value: string) =>
          value.length >= min ? ok(value) : err('TOO_SHORT'),
      });

      const passwordValidator = passwordBuilder.hasUppercase().minLength(8);
      const passwordValue = value('Password strength validation', (password: string) =>
        passwordValidator.build('strict')(password),
      );

      const validPassword = passwordValue('SecurePass');
      const weakPassword = passwordValue('weak');

      expect(unwrap(validPassword)).toBe('SecurePass');
      expect(unwrap(weakPassword)).toBe('NO_UPPERCASE');

      // Typechecking.
      expectTypeOf(passwordValue).toBeFunction();
      expectTypeOf(validPassword).toEqualTypeOf<ReturnType<typeof passwordValue>>();
      expectTypeOf(weakPassword).toEqualTypeOf<ReturnType<typeof passwordValue>>();
    });

    it('should handle create a value validator for age example from documentation', () => {
      // Create a value validator for age.
      const ageValue = value((age: number) => (age >= 18 ? ok(age) : err('INVALID_AGE')));

      // Validate individual age values.
      const validAge = ageValue(21);
      const invalidAge = ageValue(15);

      expect(unwrap(validAge)).toBe(21);
      expect(unwrap(invalidAge)).toBe('INVALID_AGE');

      // Typechecking.
      expectTypeOf(ageValue).toBeFunction();
      expectTypeOf(validAge).toEqualTypeOf<ReturnType<typeof ageValue>>();
      expectTypeOf(invalidAge).toEqualTypeOf<ReturnType<typeof ageValue>>();
    });

    it('should handle nameValue example from documentation', () => {
      const nameValue = value((name: string) => (name.length > 0 ? ok(name) : err('EMPTY_NAME')));

      const result = nameValue('John');

      expect(unwrap(result)).toBe('John');

      // Typechecking.
      expectTypeOf(nameValue).toBeFunction();
      expectTypeOf(result).toEqualTypeOf<ReturnType<typeof nameValue>>();
    });

    it('should handle check if a value is a value wrapper example from documentation', () => {
      // Check if a value is a value wrapper.
      const ageValue = value((age: number) => (age >= 18 ? ok(age) : err('INVALID_AGE')));
      const isAgeValue = isValue(ageValue);

      expect(isAgeValue).toBe(true);

      // Typechecking.
      expectTypeOf(isValue).toBeFunction();
      expectTypeOf(isAgeValue).toBeBoolean();
    });

    it('should handle check if a regular function is not a value wrapper example from documentation', () => {
      // Check if a regular function is not a value wrapper.
      const regularFunction = (age: number) => (age >= 18 ? ok(age) : err('INVALID_AGE'));
      const isValueWrapper = isValue(regularFunction);

      expect(isValueWrapper).toBe(false);

      // Typechecking.
      expectTypeOf(isValue).toBeFunction();
      expectTypeOf(isValueWrapper).toBeBoolean();
    });

    it('should handle check if other types are not value wrappers example from documentation', () => {
      // Check if other types are not value wrappers.
      const string = 'hello';
      const number = 42;
      const object = { age: 18 };

      const isStringValue = isValue(string);
      const isNumberValue = isValue(number);
      const isObjectValue = isValue(object);

      expect(isStringValue).toBe(false);
      expect(isNumberValue).toBe(false);
      expect(isObjectValue).toBe(false);

      // Typechecking.
      expectTypeOf(isValue).toBeFunction();
      expectTypeOf(isStringValue).toBeBoolean();
      expectTypeOf(isNumberValue).toBeBoolean();
      expectTypeOf(isObjectValue).toBeBoolean();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string validation', () => {
      const stringValue = value((str: string) => (str.length > 0 ? ok(str) : err('EMPTY_STRING')));
      const emptyResult = stringValue('');
      const validResult = stringValue('hello');

      expect(unwrap(emptyResult)).toBe('EMPTY_STRING');
      expect(unwrap(validResult)).toBe('hello');
    });

    it('should handle zero value validation', () => {
      const numberValue = value((num: number) => (num > 0 ? ok(num) : err('NON_POSITIVE')));

      const zeroResult = numberValue(0);
      const negativeResult = numberValue(-5);
      const positiveResult = numberValue(10);

      expect(unwrap(zeroResult)).toBe('NON_POSITIVE');
      expect(unwrap(negativeResult)).toBe('NON_POSITIVE');
      expect(unwrap(positiveResult)).toBe(10);
    });

    it('should handle boolean validation', () => {
      const booleanValue = value((bool: boolean) => {
        return bool ? ok(bool) : err('FALSE_VALUE');
      });

      const trueResult = booleanValue(true);
      expect(unwrap(trueResult)).toBe(true);
    });
  });

  describe('Integration with builder', () => {
    it('should validate passwords using value and builder integration in strict mode', () => {
      const passwordValue = value(passwordValidator.build('strict'));

      // Test cases.
      const valid = passwordValue('ValidPass1!');
      const noUpper = passwordValue('invalidpass1!');
      const noLower = passwordValue('INVALIDPASS1!');
      const noNumber = passwordValue('InvalidPass!');
      const noSpecial = passwordValue('InvalidPass1');
      const tooShort = passwordValue('V1!a');
      const tooLong = passwordValue('A'.repeat(129) + '1!a');

      // Special case: all multiple errors but only the first one is returned.
      const allErrors = passwordValue('');

      expect(unwrap(valid)).toEqual('ValidPass1!');
      expect(unwrap(noUpper)).toEqual('NO_UPPERCASE');
      expect(unwrap(noLower)).toEqual('NO_LOWERCASE');
      expect(unwrap(noNumber)).toEqual('NO_NUMBER');
      expect(unwrap(noSpecial)).toEqual('NO_SPECIAL_CHAR');
      expect(unwrap(tooShort)).toEqual('TOO_SHORT');
      expect(unwrap(tooLong)).toEqual('TOO_LONG');
      expect(unwrap(allErrors)).toEqual('NO_UPPERCASE');
    });

    it('should validate passwords using value and builder integration in all mode', () => {
      const passwordValue = value(passwordValidator.build('all'));

      // Test cases.
      const valid = passwordValue('ValidPass1!');
      const noUpper = passwordValue('invalidpass1!');
      const noLower = passwordValue('INVALIDPASS1!');
      const noNumber = passwordValue('InvalidPass!');
      const noSpecial = passwordValue('InvalidPass1');
      const tooShort = passwordValue('V1!a');
      const tooLong = passwordValue('A'.repeat(129) + '1!a');

      // Special case: all errors are returned.
      const allErrors = passwordValue('');

      expect(unwrap(valid)).toEqual('ValidPass1!');
      expect(unwrap(noUpper)).toEqual(['NO_UPPERCASE']);
      expect(unwrap(noLower)).toEqual(['NO_LOWERCASE']);
      expect(unwrap(noNumber)).toEqual(['NO_NUMBER']);
      expect(unwrap(noSpecial)).toEqual(['NO_SPECIAL_CHAR']);
      expect(unwrap(tooShort)).toEqual(['TOO_SHORT']);
      expect(unwrap(tooLong)).toEqual(['TOO_LONG']);
      expect(unwrap(allErrors)).toEqual([
        'NO_UPPERCASE',
        'NO_LOWERCASE',
        'NO_NUMBER',
        'NO_SPECIAL_CHAR',
        'TOO_SHORT',
      ]);
    });
  });
});
