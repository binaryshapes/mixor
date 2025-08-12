import { describe, expect, expectTypeOf, it } from 'vitest';

import { type Result, err, isErr, isOk, ok, unwrap } from '../src/result';
import { isRule, isValue, rule, value } from '../src/value';

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

  describe('Public API', () => {
    const helpers = createTestHelpers();

    it('should create value rules correctly', () => {
      const EmailNotEmpty = helpers.createEmailRule();
      const result = EmailNotEmpty('test@example.com');

      expect(isOk(result)).toBe(true);
      expect(unwrap(result)).toBe('test@example.com');
    });

    it('should handle rule errors correctly', () => {
      const EmailNotEmpty = helpers.createEmailRule();
      const result = EmailNotEmpty('');

      expect(isErr(result)).toBe(true);
      expect(unwrap(result)).toBe('EMPTY_EMAIL');
    });

    it('should create value validators with multiple rules', () => {
      const EmailNotEmpty = helpers.createEmailRule();
      const EmailShouldBeCorporate = helpers.createCorporateEmailRule();

      const UserEmail = value(EmailNotEmpty, EmailShouldBeCorporate);
      const result = UserEmail('john@company.com');

      expect(isOk(result)).toBe(true);
      expect(unwrap(result)).toBe('john@company.com');
    });

    it('should handle validation errors with multiple rules in all mode', () => {
      const EmailNotEmpty = helpers.createEmailRule();
      const EmailShouldBeCorporate = helpers.createCorporateEmailRule();

      const UserEmail = value(EmailNotEmpty, EmailShouldBeCorporate);
      const result = UserEmail('', 'all');

      // Typecheck for all mode.
      expectTypeOf(result).toEqualTypeOf<Result<string, ('EMPTY_EMAIL' | 'NOT_CORPORATE')[]>>();

      expect(isErr(result)).toBe(true);
      expect(unwrap(result)).toEqual(['EMPTY_EMAIL', 'NOT_CORPORATE']);
    });

    it('should handle validation errors with multiple rules in strict mode', () => {
      const EmailNotEmpty = helpers.createEmailRule();
      const EmailShouldBeCorporate = helpers.createCorporateEmailRule();

      const UserEmail = value(EmailNotEmpty, EmailShouldBeCorporate);
      const result = UserEmail('', 'strict');

      expect(isErr(result)).toBe(true);
      expect(unwrap(result)).toEqual('EMPTY_EMAIL');
    });

    it('should work with single rule', () => {
      const EmailNotEmpty = helpers.createEmailRule();
      const UserEmail = value(EmailNotEmpty);
      const result = UserEmail('test@example.com');

      expect(isOk(result)).toBe(true);
      expect(unwrap(result)).toBe('test@example.com');
    });

    it('should work with multiple rules', () => {
      const EmailNotEmpty = helpers.createEmailRule();
      const EmailShouldBeCorporate = helpers.createCorporateEmailRule();
      const EmailLength = helpers.createEmailLengthRule();

      const UserEmail = value(EmailNotEmpty, EmailShouldBeCorporate, EmailLength);
      const result = UserEmail('user@company.com');

      expect(isOk(result)).toBe(true);
      expect(unwrap(result)).toBe('user@company.com');
    });

    it('should identify value rules correctly', () => {
      const EmailNotEmpty = helpers.createEmailRule();
      expect(isRule(EmailNotEmpty)).toBe(true);
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
      expectTypeOf(isRule).toBeFunction();
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
      expectTypeOf(validationResult).toEqualTypeOf<Result<string, 'EMPTY_EMAIL'[]>>();
    });
  });
});
