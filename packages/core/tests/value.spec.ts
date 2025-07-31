import { describe, expect, expectTypeOf, it } from 'vitest';

import { type Result, err, isErr, isOk, ok, unwrap } from '../src/result';
import { isValue, isValueRule, rule, value } from '../src/value';

describe('Value', () => {
  // Shared test utilities
  const createTestHelpers = () => ({
    createEmailRule: () =>
      rule((email: string) => (email.length > 0 ? ok(email) : err('EMPTY_EMAIL'))),
    createCorporateEmailRule: () =>
      rule((email: string) => (email.includes('@company.com') ? ok(email) : err('NOT_CORPORATE'))),
    createEmailLengthRule: () =>
      rule((email: string) => (email.length <= 50 ? ok(email) : err('EMAIL_TOO_LONG'))),
  });

  describe('Basic functionality', () => {
    const helpers = createTestHelpers();

    it('should create value rules correctly', () => {
      const EmailNotEmpty = helpers.createEmailRule();
      const result = EmailNotEmpty('test@example.com');

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(unwrap(result)).toBe('test@example.com');
      }
    });

    it('should handle rule errors correctly', () => {
      const EmailNotEmpty = helpers.createEmailRule();
      const result = EmailNotEmpty('');

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(unwrap(result)).toBe('EMPTY_EMAIL');
      }
    });

    it('should create value validators with multiple rules', () => {
      const EmailNotEmpty = helpers.createEmailRule();
      const EmailShouldBeCorporate = helpers.createCorporateEmailRule();

      const UserEmail = value(EmailNotEmpty, EmailShouldBeCorporate);
      const result = UserEmail('john@company.com');

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(unwrap(result)).toBe('john@company.com');
      }
    });

    it('should handle validation errors with multiple rules', () => {
      const EmailNotEmpty = helpers.createEmailRule();
      const EmailShouldBeCorporate = helpers.createCorporateEmailRule();

      const UserEmail = value(EmailNotEmpty, EmailShouldBeCorporate);
      const result = UserEmail('');

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(unwrap(result)).toContain('EMPTY_EMAIL');
      }
    });

    it('should work with single rule', () => {
      const EmailNotEmpty = helpers.createEmailRule();
      const UserEmail = value(EmailNotEmpty);
      const result = UserEmail('test@example.com');

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(unwrap(result)).toBe('test@example.com');
      }
    });

    it('should work with multiple rules', () => {
      const EmailNotEmpty = helpers.createEmailRule();
      const EmailShouldBeCorporate = helpers.createCorporateEmailRule();
      const EmailLength = helpers.createEmailLengthRule();

      const UserEmail = value(EmailNotEmpty, EmailShouldBeCorporate, EmailLength);
      const result = UserEmail('user@company.com');

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(unwrap(result)).toBe('user@company.com');
      }
    });

    it('should identify value rules correctly', () => {
      const EmailNotEmpty = helpers.createEmailRule();
      expect(isValueRule(EmailNotEmpty)).toBe(true);
    });

    it('should identify value validators correctly', () => {
      const EmailNotEmpty = helpers.createEmailRule();
      const UserEmail = value(EmailNotEmpty);
      expect(isValue(UserEmail)).toBe(true);
    });
  });

  describe('Type safety', () => {
    it('should provide correct type inference for all public elements', () => {
      // Test all @public functions
      expectTypeOf(rule).toBeFunction();
      expectTypeOf(value).toBeFunction();
      expectTypeOf(isValue).toBeFunction();
      expectTypeOf(isValueRule).toBeFunction();

      // Test function signatures
      expectTypeOf(rule<string, 'EMPTY_EMAIL'>).toBeFunction();
      expectTypeOf(value<string, 'EMPTY_EMAIL'>).toBeFunction();
    });

    it('should validate generic type constraints', () => {
      // Test generic functions with type constraints
      const EmailNotEmpty = rule((email: string) =>
        email.length > 0 ? ok(email) : err('EMPTY_EMAIL'),
      );
      expectTypeOf(EmailNotEmpty).toBeFunction();
      expectTypeOf(EmailNotEmpty('test')).toEqualTypeOf<Result<string, 'EMPTY_EMAIL'>>();

      const UserEmail = value(EmailNotEmpty);
      expectTypeOf(UserEmail).toBeFunction();
      expectTypeOf(UserEmail('test')).toEqualTypeOf<Result<string, 'EMPTY_EMAIL'>>();
    });

    it('should validate Result types correctly', () => {
      // Test Result type inference
      const EmailNotEmpty = rule((email: string) =>
        email.length > 0 ? ok(email) : err('EMPTY_EMAIL'),
      );
      const result = EmailNotEmpty('test@example.com');
      expectTypeOf(result).toEqualTypeOf<Result<string, 'EMPTY_EMAIL'>>();

      const UserEmail = value(EmailNotEmpty);
      const validationResult = UserEmail('test@example.com');
      expectTypeOf(validationResult).toEqualTypeOf<Result<string, 'EMPTY_EMAIL'>>();
    });
  });

  describe('Code examples', () => {
    it('should run example value-001: Basic rule creation for string validation', () => {
      const EmailNotEmpty = rule((email: string) =>
        email.length > 0 ? ok(email) : err('EMPTY_EMAIL'),
      );

      const result = EmailNotEmpty('test@example.com');
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(unwrap(result)).toBe('test@example.com');
      }
    });

    it('should run example value-002: Rule with custom error handling', () => {
      const EmailShouldBeCorporate = rule((email: string) =>
        email.includes('@company.com') ? ok(email) : err('NOT_CORPORATE'),
      );

      const result = EmailShouldBeCorporate('user@company.com');
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(unwrap(result)).toBe('user@company.com');
      }
    });

    it('should run example value-003: Basic value validation with multiple rules', () => {
      const EmailNotEmpty = rule((email: string) =>
        email.length > 0 ? ok(email) : err('EMPTY_EMAIL'),
      );
      const EmailShouldBeCorporate = rule((email: string) =>
        email.includes('@company.com') ? ok(email) : err('NOT_CORPORATE'),
      );

      const UserEmail = value(EmailNotEmpty, EmailShouldBeCorporate);
      const result = UserEmail('john@company.com');
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(unwrap(result)).toBe('john@company.com');
      }
    });

    it('should run example value-004: Value validation with error handling', () => {
      const EmailNotEmpty = rule((email: string) =>
        email.length > 0 ? ok(email) : err('EMPTY_EMAIL'),
      );
      const EmailShouldBeCorporate = rule((email: string) =>
        email.includes('@company.com') ? ok(email) : err('NOT_CORPORATE'),
      );

      const UserEmail = value(EmailNotEmpty, EmailShouldBeCorporate);
      const result = UserEmail('');

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(unwrap(result)).toContain('EMPTY_EMAIL');
      }
    });

    it('should run example value-005: Rule with metadata for better tracing', () => {
      const EmailNotEmpty = rule((email: string) =>
        email.length > 0 ? ok(email) : err('EMPTY_EMAIL'),
      ).meta({
        name: 'EmailNotEmpty',
        description: 'Validates that email is not empty',
        scope: 'UserValidation',
      });

      const result = EmailNotEmpty('test@example.com');
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(unwrap(result)).toBe('test@example.com');
      }
    });

    it('should run example value-006: Value validator with metadata for tracing', () => {
      const EmailNotEmpty = rule((email: string) =>
        email.length > 0 ? ok(email) : err('EMPTY_EMAIL'),
      ).meta({
        name: 'EmailNotEmpty',
        description: 'Validates that email is not empty',
        scope: 'UserValidation',
      });

      const EmailShouldBeCorporate = rule((email: string) =>
        email.includes('@company.com') ? ok(email) : err('NOT_CORPORATE'),
      ).meta({
        name: 'EmailShouldBeCorporate',
        description: 'Validates that email is corporate',
        scope: 'UserValidation',
      });

      const UserEmail = value(EmailNotEmpty, EmailShouldBeCorporate).meta({
        name: 'UserEmail',
        description: 'Complete email validation for users',
        scope: 'UserValidation',
        example: 'john@company.com',
      });

      const result = UserEmail('john@company.com');
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(unwrap(result)).toBe('john@company.com');
      }
    });
  });
});
