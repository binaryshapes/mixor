import { describe, expect, expectTypeOf, it } from 'vitest';

import { type Result, unwrap } from '@mixor/core';

import { email, hasDomain, isEmail } from '../src/email';

// *********************************************************************************************
// Individual function tests.
// *********************************************************************************************

// Test data for email validation functions.
const validEmail = 'test@example.com';
const validEmailWithPlus = 'user+tag@example.com';
const validEmailWithSpecialChars = 'user.name+tag@example.com';
const invalidEmail = 'invalid-email';
const invalidEmailNoAt = 'testexample.com';
const invalidEmailNoDomain = 'test@';
const invalidEmailNoLocal = '@example.com';
const validDomain = 'example.com';
const validDomainArray = ['example.com', 'test.com'];
const validEmailForDomain = 'user@test.com';
const invalidEmailForDomain = 'user@invalid.com';

describe('Email validation functions', () => {
  describe('isEmail', () => {
    it('should run example email-001: Basic email validation with default pattern', () => {
      const result = isEmail()(validEmail);
      expect(unwrap(result)).toBe(validEmail);

      // Typechecking.
      expectTypeOf(isEmail).toBeFunction();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'INVALID_EMAIL'>>();
    });

    it('should run example email-002: Email validation with specific pattern type', () => {
      const result = isEmail('html5Email')(validEmailWithPlus);
      expect(unwrap(result)).toBe(validEmailWithPlus);

      // Typechecking.
      expectTypeOf(isEmail).toBeFunction();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'INVALID_EMAIL'>>();
    });

    it('should run example email-003: Invalid email validation', () => {
      const result = isEmail()(invalidEmail);
      expect(unwrap(result)).toBe('INVALID_EMAIL');

      // Typechecking.
      expectTypeOf(isEmail).toBeFunction();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'INVALID_EMAIL'>>();
    });

    it('should validate email with different pattern types', () => {
      const result1 = isEmail('common')(validEmail);
      expect(unwrap(result1)).toBe(validEmail);

      const result2 = isEmail('html5Email')(validEmailWithSpecialChars);
      expect(unwrap(result2)).toBe(validEmailWithSpecialChars);

      const result3 = isEmail('rfc5322Email')(validEmail);
      expect(unwrap(result3)).toBe(validEmail);

      const result4 = isEmail('unicodeEmail')(validEmail);
      expect(unwrap(result4)).toBe(validEmail);

      const result5 = isEmail('browserEmail')(validEmail);
      expect(unwrap(result5)).toBe(validEmail);

      // Typechecking.
      expectTypeOf(isEmail).toBeFunction();
      expectTypeOf(result1).toEqualTypeOf<Result<string, 'INVALID_EMAIL'>>();
    });

    it('should reject invalid email formats', () => {
      const result1 = isEmail()(invalidEmailNoAt);
      expect(unwrap(result1)).toBe('INVALID_EMAIL');

      const result2 = isEmail()(invalidEmailNoDomain);
      expect(unwrap(result2)).toBe('INVALID_EMAIL');

      const result3 = isEmail()(invalidEmailNoLocal);
      expect(unwrap(result3)).toBe('INVALID_EMAIL');

      // Typechecking.
      expectTypeOf(isEmail).toBeFunction();
      expectTypeOf(result1).toEqualTypeOf<Result<string, 'INVALID_EMAIL'>>();
    });
  });

  describe('hasDomain', () => {
    it('should run example email-004: Single domain validation', () => {
      const result = hasDomain(validDomain)(validEmail);
      expect(unwrap(result)).toBe(validEmail);

      // Typechecking.
      expectTypeOf(hasDomain).toBeFunction();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'INVALID_DOMAIN'>>();
    });

    it('should run example email-005: Multiple domains validation', () => {
      const result = hasDomain(validDomainArray)(validEmailForDomain);
      expect(unwrap(result)).toBe(validEmailForDomain);

      // Typechecking.
      expectTypeOf(hasDomain).toBeFunction();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'INVALID_DOMAIN'>>();
    });

    it('should run example email-006: Invalid domain validation', () => {
      const result = hasDomain(validDomain)(invalidEmailForDomain);
      expect(unwrap(result)).toBe('INVALID_DOMAIN');

      // Typechecking.
      expectTypeOf(hasDomain).toBeFunction();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'INVALID_DOMAIN'>>();
    });

    it('should validate single domain correctly', () => {
      const result = hasDomain('example.com')('user@example.com');
      expect(unwrap(result)).toBe('user@example.com');

      const invalidResult = hasDomain('example.com')('user@other.com');
      expect(unwrap(invalidResult)).toBe('INVALID_DOMAIN');

      // Typechecking.
      expectTypeOf(hasDomain).toBeFunction();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'INVALID_DOMAIN'>>();
    });

    it('should validate multiple domains correctly', () => {
      const domains = ['example.com', 'test.com', 'demo.com'];

      const result1 = hasDomain(domains)('user@example.com');
      expect(unwrap(result1)).toBe('user@example.com');

      const result2 = hasDomain(domains)('user@test.com');
      expect(unwrap(result2)).toBe('user@test.com');

      const result3 = hasDomain(domains)('user@demo.com');
      expect(unwrap(result3)).toBe('user@demo.com');

      const invalidResult = hasDomain(domains)('user@invalid.com');
      expect(unwrap(invalidResult)).toBe('INVALID_DOMAIN');

      // Typechecking.
      expectTypeOf(hasDomain).toBeFunction();
      expectTypeOf(result1).toEqualTypeOf<Result<string, 'INVALID_DOMAIN'>>();
    });

    it('should handle edge cases for domain validation', () => {
      // Email without @ symbol
      const result1 = hasDomain('example.com')('invalid-email');
      expect(unwrap(result1)).toBe('INVALID_DOMAIN');

      // Email with multiple @ symbols
      const result2 = hasDomain('example.com')('user@test@example.com');
      expect(unwrap(result2)).toBe('INVALID_DOMAIN');

      // Empty domain array
      const result3 = hasDomain([])('user@example.com');
      expect(unwrap(result3)).toBe('INVALID_DOMAIN');

      // Typechecking.
      expectTypeOf(hasDomain).toBeFunction();
      expectTypeOf(result1).toEqualTypeOf<Result<string, 'INVALID_DOMAIN'>>();
    });
  });

  describe('email builder', () => {
    it('should run example email-007: Email builder with validation', () => {
      const emailValidator = email.isEmail().build();
      const result = emailValidator(validEmail);
      expect(unwrap(result)).toBe(validEmail);

      // Typechecking.
      expectTypeOf(isEmail).toBeFunction();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'INVALID_EMAIL'>>();
    });

    it('should run example email-008: Email builder with domain validation', () => {
      const domainValidator = email.hasDomain(validDomain).build();
      const result = domainValidator(validEmail);
      expect(unwrap(result)).toBe(validEmail);

      // Typechecking.
      expectTypeOf(hasDomain).toBeFunction();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'INVALID_DOMAIN'>>();
    });

    it('should provide all expected methods', () => {
      expect(email.isEmail).toBeDefined();
      expect(email.hasDomain).toBeDefined();

      // Typechecking.
      expectTypeOf(email).toHaveProperty('isEmail');
      expectTypeOf(email).toHaveProperty('hasDomain');
    });

    it('should handle invalid email through builder', () => {
      const emailValidator = email.isEmail().build();
      const result = emailValidator(invalidEmail);
      expect(unwrap(result)).toBe('INVALID_EMAIL');

      // Typechecking.
      expectTypeOf(isEmail).toBeFunction();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'INVALID_EMAIL'>>();
    });

    it('should handle invalid domain through builder', () => {
      const domainValidator = email.hasDomain(validDomain).build();
      const result = domainValidator(invalidEmailForDomain);
      expect(unwrap(result)).toBe('INVALID_DOMAIN');

      // Typechecking.
      expectTypeOf(hasDomain).toBeFunction();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'INVALID_DOMAIN'>>();
    });

    it('should handle combined email validation', () => {
      const emailValidator = email.isEmail().hasDomain(validDomain).build();

      const result = emailValidator(validEmail);
      expect(unwrap(result)).toBe(validEmail);

      const invalidResult = emailValidator(invalidEmail);
      expect(unwrap(invalidResult)).toBe('INVALID_EMAIL');
    });

    it('should handle multiple domains validation', () => {
      const multiDomainValidator = email.hasDomain(validDomainArray).build();

      const result1 = multiDomainValidator(validEmail);
      expect(unwrap(result1)).toBe(validEmail);

      const result2 = multiDomainValidator(validEmailForDomain);
      expect(unwrap(result2)).toBe(validEmailForDomain);

      const invalidResult = multiDomainValidator(invalidEmailForDomain);
      expect(unwrap(invalidResult)).toBe('INVALID_DOMAIN');
    });
  });

  describe('Type safety', () => {
    it('should provide correct type inference for isEmail', () => {
      expectTypeOf(isEmail).toBeFunction();
      expectTypeOf(isEmail()).toBeFunction();
      expectTypeOf(isEmail()('test@example.com')).toEqualTypeOf<Result<string, 'INVALID_EMAIL'>>();
    });

    it('should provide correct type inference for hasDomain', () => {
      expectTypeOf(hasDomain).toBeFunction();
      expectTypeOf(hasDomain('example.com')).toBeFunction();
      expectTypeOf(hasDomain(['example.com', 'test.com'])).toBeFunction();
      expectTypeOf(hasDomain('example.com')('test@example.com')).toEqualTypeOf<
        Result<string, 'INVALID_DOMAIN'>
      >();
    });

    it('should provide correct type inference for email builder', () => {
      expectTypeOf(email).toBeObject();
      expectTypeOf(isEmail).toBeFunction();
      expectTypeOf(hasDomain).toBeFunction();
    });
  });
});
