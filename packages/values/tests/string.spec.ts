import { type Result, unwrap } from '@mixor/core';
import { describe, expect, expectTypeOf, it } from 'vitest';

import * as Str from '../src/string';

// *********************************************************************************************
// Individual function tests.
// *********************************************************************************************

// Test data for string validation functions.
const validString = 'hello';
const validNumber = 123;
const validBoolean = true;
const validNull = null;
const validUndefined = undefined;
const validObject = {};
const validArray: unknown[] = [];
const emptyString = '';
const whitespaceString = '   ';
const longString = 'hello world';
const shortString = 'short';
const tooLongString = 'too long string';
const validList = ['hello', 'world'];
const validValue = 'hello';
const invalidValue = 'other';
const validSlug = 'my-awesome-blog-post-2024-with-special-characters';
const invalidSlug = 'my--invalid-slug-with-double-dash$$$';
const validNumeric = '1234567890';
const invalidNumeric = '123abc';
const validRegexMatch = 'hello-world';
const invalidRegexMatch = 'Hello World';
const validHexadecimal = 'FFAA00';
const invalidHexadecimal = 'FFAA00GG';
const validBase64 = 'SGVsbG8gV29ybGQ=';
const invalidBase64 = 'invalid-base64';
const validDate = '2021-01-01';
const invalidDate = 'invalid-date';
const validDateTime = '2021-01-01T12:34:56';
const invalidDateTime = 'invalid-datetime';
const validTime = '12:34:56';
const invalidTime = 'invalid-time';
const validPhoneNumber = '+1234567890';
const invalidPhoneNumber = 'invalid-phone';
const validEmoji = '👍';
const invalidEmoji = 'not-emoji';
const validRGBA = 'rgba(255, 170, 0, 0.1)';
const invalidRGBA = 'invalid-rgba';

describe('String validation functions', () => {
  describe('coerce', () => {
    it('should run example string-001: Coerce string value', () => {
      const result = Str.coerce(validString);
      expect(unwrap(result)).toBe(validString);

      // Typechecking.
      expectTypeOf(Str.coerce).toEqualTypeOf<(value: unknown) => Result<string, never>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, never>>();
    });

    it('should run example string-002: Coerce number to string', () => {
      const result = Str.coerce(validNumber);
      expect(unwrap(result)).toBe('123');

      // Typechecking.
      expectTypeOf(Str.coerce).toEqualTypeOf<(value: unknown) => Result<string, never>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, never>>();
    });

    it('should coerce boolean to string', () => {
      const result = Str.coerce(validBoolean);
      expect(unwrap(result)).toBe('true');

      // Typechecking.
      expectTypeOf(Str.coerce).toEqualTypeOf<(value: unknown) => Result<string, never>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, never>>();
    });

    it('should coerce null to string', () => {
      const result = Str.coerce(validNull);
      expect(unwrap(result)).toBe('null');

      // Typechecking.
      expectTypeOf(Str.coerce).toEqualTypeOf<(value: unknown) => Result<string, never>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, never>>();
    });

    it('should coerce undefined to string', () => {
      const result = Str.coerce(validUndefined);
      expect(unwrap(result)).toBe('undefined');

      // Typechecking.
      expectTypeOf(Str.coerce).toEqualTypeOf<(value: unknown) => Result<string, never>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, never>>();
    });

    it('should coerce object to string', () => {
      const result = Str.coerce(validObject);
      expect(unwrap(result)).toBe('[object Object]');

      // Typechecking.
      expectTypeOf(Str.coerce).toEqualTypeOf<(value: unknown) => Result<string, never>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, never>>();
    });

    it('should coerce array to string', () => {
      const result = Str.coerce(validArray);
      expect(unwrap(result)).toBe('');

      // Typechecking.
      expectTypeOf(Str.coerce).toEqualTypeOf<(value: unknown) => Result<string, never>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, never>>();
    });
  });

  describe('isString', () => {
    it('should run example string-003: Validate string value', () => {
      const result = Str.isString(validString);
      expect(unwrap(result)).toBe(validString);

      // Typechecking.
      expectTypeOf(Str.isString).toEqualTypeOf<(value: unknown) => Result<string, 'NOT_STRING'>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'NOT_STRING'>>();
    });

    it('should run example string-004: Reject number value', () => {
      const result = Str.isString(validNumber);
      expect(unwrap(result)).toBe('NOT_STRING');

      // Typechecking.
      expectTypeOf(Str.isString).toEqualTypeOf<(value: unknown) => Result<string, 'NOT_STRING'>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'NOT_STRING'>>();
    });

    it('should run example string-005: Reject boolean value', () => {
      const result = Str.isString(validBoolean);
      expect(unwrap(result)).toBe('NOT_STRING');

      // Typechecking.
      expectTypeOf(Str.isString).toEqualTypeOf<(value: unknown) => Result<string, 'NOT_STRING'>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'NOT_STRING'>>();
    });

    it('should run example string-006: Reject null value', () => {
      const result = Str.isString(validNull);
      expect(unwrap(result)).toBe('NOT_STRING');

      // Typechecking.
      expectTypeOf(Str.isString).toEqualTypeOf<(value: unknown) => Result<string, 'NOT_STRING'>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'NOT_STRING'>>();
    });

    it('should run example string-007: Reject undefined value', () => {
      const result = Str.isString(validUndefined);
      expect(unwrap(result)).toBe('NOT_STRING');

      // Typechecking.
      expectTypeOf(Str.isString).toEqualTypeOf<(value: unknown) => Result<string, 'NOT_STRING'>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'NOT_STRING'>>();
    });

    it('should run example string-008: Reject object value', () => {
      const result = Str.isString(validObject);
      expect(unwrap(result)).toBe('NOT_STRING');

      // Typechecking.
      expectTypeOf(Str.isString).toEqualTypeOf<(value: unknown) => Result<string, 'NOT_STRING'>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'NOT_STRING'>>();
    });

    it('should run example string-009: Reject array value', () => {
      const result = Str.isString(validArray);
      expect(unwrap(result)).toBe('NOT_STRING');

      // Typechecking.
      expectTypeOf(Str.isString).toEqualTypeOf<(value: unknown) => Result<string, 'NOT_STRING'>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'NOT_STRING'>>();
    });
  });

  describe('isNotEmpty', () => {
    it('should run example string-010: Validate non-empty string', () => {
      const result = Str.isNotEmpty(validString);
      expect(unwrap(result)).toBe(validString);

      // Typechecking.
      expectTypeOf(Str.isNotEmpty).toEqualTypeOf<(value: string) => Result<string, 'IS_EMPTY'>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'IS_EMPTY'>>();
    });

    it('should run example string-011: Reject empty string', () => {
      const result = Str.isNotEmpty(emptyString);
      expect(unwrap(result)).toBe('IS_EMPTY');

      // Typechecking.
      expectTypeOf(Str.isNotEmpty).toEqualTypeOf<(value: string) => Result<string, 'IS_EMPTY'>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'IS_EMPTY'>>();
    });

    it('should reject whitespace-only string', () => {
      const result = Str.isNotEmpty(whitespaceString);
      expect(unwrap(result)).toBe('IS_EMPTY');

      // Typechecking.
      expectTypeOf(Str.isNotEmpty).toEqualTypeOf<(value: string) => Result<string, 'IS_EMPTY'>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'IS_EMPTY'>>();
    });
  });

  describe('hasMinLength', () => {
    it('should run example string-012: Validate string with minimum length', () => {
      const result = Str.hasMinLength(10)(longString);
      expect(unwrap(result)).toBe(longString);

      // Typechecking.
      expectTypeOf(Str.hasMinLength).toEqualTypeOf<
        (minLength: number) => (value: string) => Result<string, 'TOO_SHORT'>
      >();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'TOO_SHORT'>>();
    });

    it('should run example string-013: Reject string with insufficient length', () => {
      const result = Str.hasMinLength(10)(shortString);
      expect(unwrap(result)).toBe('TOO_SHORT');

      // Typechecking.
      expectTypeOf(Str.hasMinLength).toEqualTypeOf<
        (minLength: number) => (value: string) => Result<string, 'TOO_SHORT'>
      >();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'TOO_SHORT'>>();
    });
  });

  describe('hasMaxLength', () => {
    it('should run example string-014: Validate string with maximum length', () => {
      const result = Str.hasMaxLength(10)(shortString);
      expect(unwrap(result)).toBe(shortString);

      // Typechecking.
      expectTypeOf(Str.hasMaxLength).toEqualTypeOf<
        (maxLength: number) => (value: string) => Result<string, 'TOO_LONG'>
      >();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'TOO_LONG'>>();
    });

    it('should run example string-015: Reject string exceeding maximum length', () => {
      const result = Str.hasMaxLength(10)(tooLongString);
      expect(unwrap(result)).toBe('TOO_LONG');

      // Typechecking.
      expectTypeOf(Str.hasMaxLength).toEqualTypeOf<
        (maxLength: number) => (value: string) => Result<string, 'TOO_LONG'>
      >();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'TOO_LONG'>>();
    });
  });

  describe('contains', () => {
    it('should run example string-016: Validate string contained in list', () => {
      const result = Str.contains(validList)(validValue);
      expect(unwrap(result)).toBe(validValue);

      // Typechecking.
      expectTypeOf(Str.contains).toEqualTypeOf<
        (list: string[]) => (value: string) => Result<string, 'NOT_CONTAIN'>
      >();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'NOT_CONTAIN'>>();
    });

    it('should run example string-017: Reject string not contained in list', () => {
      const result = Str.contains(validList)(invalidValue);
      expect(unwrap(result)).toBe('NOT_CONTAIN');

      // Typechecking.
      expectTypeOf(Str.contains).toEqualTypeOf<
        (list: string[]) => (value: string) => Result<string, 'NOT_CONTAIN'>
      >();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'NOT_CONTAIN'>>();
    });
  });

  describe('matches', () => {
    it('should run example string-018: Validate string matching regex pattern', () => {
      const result = Str.matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)(validRegexMatch);
      expect(unwrap(result)).toBe(validRegexMatch);

      // Typechecking.
      expectTypeOf(Str.matches).toEqualTypeOf<
        (pattern: RegExp) => (value: string) => Result<string, 'NOT_MATCH'>
      >();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'NOT_MATCH'>>();
    });

    it('should run example string-019: Reject string not matching regex pattern', () => {
      const result = Str.matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)(invalidRegexMatch);
      expect(unwrap(result)).toBe('NOT_MATCH');

      // Typechecking.
      expectTypeOf(Str.matches).toEqualTypeOf<
        (pattern: RegExp) => (value: string) => Result<string, 'NOT_MATCH'>
      >();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'NOT_MATCH'>>();
    });
  });

  describe('isSlug', () => {
    it('should run example string-020: Validate valid slug', () => {
      const result = Str.isSlug(validSlug);
      expect(unwrap(result)).toBe(validSlug);

      // Typechecking.
      expectTypeOf(Str.isSlug).toEqualTypeOf<(value: string) => Result<string, 'INVALID_SLUG'>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'INVALID_SLUG'>>();
    });

    it('should run example string-021: Reject invalid slug', () => {
      const result = Str.isSlug(invalidSlug);
      expect(unwrap(result)).toBe('INVALID_SLUG');

      // Typechecking.
      expectTypeOf(Str.isSlug).toEqualTypeOf<(value: string) => Result<string, 'INVALID_SLUG'>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'INVALID_SLUG'>>();
    });
  });

  describe('isNumeric', () => {
    it('should run example string-022: Validate numeric string', () => {
      const result = Str.isNumeric(validNumeric);
      expect(unwrap(result)).toBe(validNumeric);

      // Typechecking.
      expectTypeOf(Str.isNumeric).toEqualTypeOf<(value: string) => Result<string, 'NOT_NUMERIC'>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'NOT_NUMERIC'>>();
    });

    it('should run example string-023: Reject non-numeric string', () => {
      const result = Str.isNumeric(invalidNumeric);
      expect(unwrap(result)).toBe('NOT_NUMERIC');

      // Typechecking.
      expectTypeOf(Str.isNumeric).toEqualTypeOf<(value: string) => Result<string, 'NOT_NUMERIC'>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'NOT_NUMERIC'>>();
    });
  });

  describe('isHexadecimal', () => {
    it('should run example string-024: Validate hexadecimal string', () => {
      const result = Str.isHexadecimal(validHexadecimal);
      expect(unwrap(result)).toBe(validHexadecimal);

      // Typechecking.
      expectTypeOf(Str.isHexadecimal).toEqualTypeOf<
        (value: string) => Result<string, 'NOT_HEXADECIMAL'>
      >();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'NOT_HEXADECIMAL'>>();
    });

    it('should run example string-025: Reject invalid hexadecimal string', () => {
      const result = Str.isHexadecimal(invalidHexadecimal);
      expect(unwrap(result)).toBe('NOT_HEXADECIMAL');

      // Typechecking.
      expectTypeOf(Str.isHexadecimal).toEqualTypeOf<
        (value: string) => Result<string, 'NOT_HEXADECIMAL'>
      >();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'NOT_HEXADECIMAL'>>();
    });
  });

  describe('isBase64', () => {
    it('should run example string-026: Validate base64 string', () => {
      const result = Str.isBase64(validBase64);
      expect(unwrap(result)).toBe(validBase64);

      // Typechecking.
      expectTypeOf(Str.isBase64).toEqualTypeOf<(value: string) => Result<string, 'NOT_BASE64'>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'NOT_BASE64'>>();
    });

    it('should run example string-027: Reject invalid base64 string', () => {
      const result = Str.isBase64(invalidBase64);
      expect(unwrap(result)).toBe('NOT_BASE64');

      // Typechecking.
      expectTypeOf(Str.isBase64).toEqualTypeOf<(value: string) => Result<string, 'NOT_BASE64'>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'NOT_BASE64'>>();
    });
  });

  describe('isDate', () => {
    it('should run example string-028: Validate date string', () => {
      const result = Str.isDate(validDate);
      expect(unwrap(result)).toBe(validDate);

      // Typechecking.
      expectTypeOf(Str.isDate).toEqualTypeOf<(value: string) => Result<string, 'INVALID_DATE'>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'INVALID_DATE'>>();
    });

    it('should run example string-029: Reject invalid date string', () => {
      const result = Str.isDate(invalidDate);
      expect(unwrap(result)).toBe('INVALID_DATE');

      // Typechecking.
      expectTypeOf(Str.isDate).toEqualTypeOf<(value: string) => Result<string, 'INVALID_DATE'>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'INVALID_DATE'>>();
    });
  });

  describe('isDateTime', () => {
    it('should run example string-030: Validate date time string', () => {
      const result = Str.isDateTime(validDateTime);
      expect(unwrap(result)).toBe(validDateTime);

      // Typechecking.
      expectTypeOf(Str.isDateTime).toEqualTypeOf<
        (value: string) => Result<string, 'INVALID_DATE_TIME'>
      >();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'INVALID_DATE_TIME'>>();
    });

    it('should run example string-031: Reject invalid date time string', () => {
      const result = Str.isDateTime(invalidDateTime);
      expect(unwrap(result)).toBe('INVALID_DATE_TIME');

      // Typechecking.
      expectTypeOf(Str.isDateTime).toEqualTypeOf<
        (value: string) => Result<string, 'INVALID_DATE_TIME'>
      >();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'INVALID_DATE_TIME'>>();
    });
  });

  describe('isTime', () => {
    it('should run example string-032: Validate time string', () => {
      const result = Str.isTime(validTime);
      expect(unwrap(result)).toBe(validTime);

      // Typechecking.
      expectTypeOf(Str.isTime).toEqualTypeOf<(value: string) => Result<string, 'INVALID_TIME'>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'INVALID_TIME'>>();
    });

    it('should run example string-033: Reject invalid time string', () => {
      const result = Str.isTime(invalidTime);
      expect(unwrap(result)).toBe('INVALID_TIME');

      // Typechecking.
      expectTypeOf(Str.isTime).toEqualTypeOf<(value: string) => Result<string, 'INVALID_TIME'>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'INVALID_TIME'>>();
    });
  });

  describe('isPhoneNumber', () => {
    it('should run example string-034: Validate phone number', () => {
      const result = Str.isPhoneNumber(validPhoneNumber);
      expect(unwrap(result)).toBe(validPhoneNumber);

      // Typechecking.
      expectTypeOf(Str.isPhoneNumber).toEqualTypeOf<
        (value: string) => Result<string, 'INVALID_PHONE_NUMBER'>
      >();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'INVALID_PHONE_NUMBER'>>();
    });

    it('should run example string-035: Reject invalid phone number', () => {
      const result = Str.isPhoneNumber(invalidPhoneNumber);
      expect(unwrap(result)).toBe('INVALID_PHONE_NUMBER');

      // Typechecking.
      expectTypeOf(Str.isPhoneNumber).toEqualTypeOf<
        (value: string) => Result<string, 'INVALID_PHONE_NUMBER'>
      >();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'INVALID_PHONE_NUMBER'>>();
    });
  });

  describe('isEmoji', () => {
    it('should run example string-036: Validate emoji', () => {
      const result = Str.isEmoji(validEmoji);
      expect(unwrap(result)).toBe(validEmoji);

      // Typechecking.
      expectTypeOf(Str.isEmoji).toEqualTypeOf<(value: string) => Result<string, 'INVALID_EMOJI'>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'INVALID_EMOJI'>>();
    });

    it('should run example string-037: Reject invalid emoji', () => {
      const result = Str.isEmoji(invalidEmoji);
      expect(unwrap(result)).toBe('INVALID_EMOJI');

      // Typechecking.
      expectTypeOf(Str.isEmoji).toEqualTypeOf<(value: string) => Result<string, 'INVALID_EMOJI'>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'INVALID_EMOJI'>>();
    });
  });

  describe('isRGBA', () => {
    it('should run example string-038: Validate RGBA color', () => {
      const result = Str.isRGBA(validRGBA);
      expect(unwrap(result)).toBe(validRGBA);

      // Typechecking.
      expectTypeOf(Str.isRGBA).toEqualTypeOf<(value: string) => Result<string, 'INVALID_RGBA'>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'INVALID_RGBA'>>();
    });

    it('should run example string-039: Reject invalid RGBA color', () => {
      const result = Str.isRGBA(invalidRGBA);
      expect(unwrap(result)).toBe('INVALID_RGBA');

      // Typechecking.
      expectTypeOf(Str.isRGBA).toEqualTypeOf<(value: string) => Result<string, 'INVALID_RGBA'>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'INVALID_RGBA'>>();
    });
  });
});
