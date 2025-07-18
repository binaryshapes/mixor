import { describe, expect, expectTypeOf, it } from 'vitest';

import { type Result, unwrap } from '@mixor/core';

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
const validRGB = 'rgb(0, 0, 0)';
const invalidRGB = 'invalid-rgb';
const validAlpha = 'Hello';
const invalidAlphaNumbers = 'Hello123';
const invalidAlphaSpaces = 'Hello World';
const validAlphaNumeric = 'Hello123';
const invalidAlphaNumericSpaces = 'Hello 123';
const invalidAlphaNumericSymbols = 'Hello@123';
const validLowerCase = 'hello';
const invalidLowerCaseUpper = 'Hello';
const invalidLowerCaseNumbers = 'hello123';
const validUpperCase = 'HELLO';
const invalidUpperCaseLower = 'Hello';
const invalidUpperCaseNumbers = 'HELLO123';
const validCapitalized = 'Hello';
const invalidCapitalizedLower = 'hello';
const invalidCapitalizedUpper = 'HELLO';
const invalidCapitalizedMulti = 'Hello World';
const validStartsWith = 'Hello World';
const invalidStartsWith = 'World Hello';
const validEndsWith = 'Hello World';
const invalidEndsWith = 'World Hello';
const validBigIntString = '1234567890123456789012345678901234567890';
const invalidBigIntString = '123.45';
const validIntegerString = '123456';
const invalidIntegerString = '123.45';
const validBooleanString = 'true';
const invalidBooleanString = 'maybe';
const validNumberString = '123.45';
const invalidNumberString = 'not-a-number';

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

  describe('isRGB', () => {
    it('should run example string-040: Validate RGB color', () => {
      const result = Str.isRGB(validRGB);
      expect(unwrap(result)).toBe(validRGB);
      expectTypeOf(Str.isRGB).toEqualTypeOf<(value: string) => Result<string, 'INVALID_RGB'>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'INVALID_RGB'>>();
    });
    it('should run example string-041: Reject invalid RGB color', () => {
      const result = Str.isRGB(invalidRGB);
      expect(unwrap(result)).toBe('INVALID_RGB');
      expectTypeOf(Str.isRGB).toEqualTypeOf<(value: string) => Result<string, 'INVALID_RGB'>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'INVALID_RGB'>>();
    });
  });

  describe('isAlpha', () => {
    it('should run example string-042: Validate alphabetic string', () => {
      const result = Str.isAlpha(validAlpha);
      expect(unwrap(result)).toBe(validAlpha);
      expectTypeOf(Str.isAlpha).toEqualTypeOf<(value: string) => Result<string, 'NOT_ALPHA'>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'NOT_ALPHA'>>();
    });
    it('should run example string-043: Reject string with numbers', () => {
      const result = Str.isAlpha(invalidAlphaNumbers);
      expect(unwrap(result)).toBe('NOT_ALPHA');
      expectTypeOf(Str.isAlpha).toEqualTypeOf<(value: string) => Result<string, 'NOT_ALPHA'>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'NOT_ALPHA'>>();
    });
    it('should run example string-044: Reject string with spaces', () => {
      const result = Str.isAlpha(invalidAlphaSpaces);
      expect(unwrap(result)).toBe('NOT_ALPHA');
      expectTypeOf(Str.isAlpha).toEqualTypeOf<(value: string) => Result<string, 'NOT_ALPHA'>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'NOT_ALPHA'>>();
    });
  });

  describe('isAlphaNumeric', () => {
    it('should run example string-045: Validate alphanumeric string', () => {
      const result = Str.isAlphaNumeric(validAlphaNumeric);
      expect(unwrap(result)).toBe(validAlphaNumeric);
      expectTypeOf(Str.isAlphaNumeric).toEqualTypeOf<
        (value: string) => Result<string, 'NOT_ALPHANUMERIC'>
      >();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'NOT_ALPHANUMERIC'>>();
    });
    it('should run example string-046: Reject string with spaces', () => {
      const result = Str.isAlphaNumeric(invalidAlphaNumericSpaces);
      expect(unwrap(result)).toBe('NOT_ALPHANUMERIC');
      expectTypeOf(Str.isAlphaNumeric).toEqualTypeOf<
        (value: string) => Result<string, 'NOT_ALPHANUMERIC'>
      >();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'NOT_ALPHANUMERIC'>>();
    });
    it('should run example string-047: Reject string with symbols', () => {
      const result = Str.isAlphaNumeric(invalidAlphaNumericSymbols);
      expect(unwrap(result)).toBe('NOT_ALPHANUMERIC');
      expectTypeOf(Str.isAlphaNumeric).toEqualTypeOf<
        (value: string) => Result<string, 'NOT_ALPHANUMERIC'>
      >();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'NOT_ALPHANUMERIC'>>();
    });
  });

  describe('isLowerCase', () => {
    it('should run example string-048: Validate lowercase string', () => {
      const result = Str.isLowerCase(validLowerCase);
      expect(unwrap(result)).toBe(validLowerCase);
      expectTypeOf(Str.isLowerCase).toEqualTypeOf<
        (value: string) => Result<string, 'NOT_LOWERCASE'>
      >();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'NOT_LOWERCASE'>>();
    });
    it('should run example string-049: Reject string with uppercase', () => {
      const result = Str.isLowerCase(invalidLowerCaseUpper);
      expect(unwrap(result)).toBe('NOT_LOWERCASE');
      expectTypeOf(Str.isLowerCase).toEqualTypeOf<
        (value: string) => Result<string, 'NOT_LOWERCASE'>
      >();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'NOT_LOWERCASE'>>();
    });
    it('should run example string-050: Reject string with numbers', () => {
      const result = Str.isLowerCase(invalidLowerCaseNumbers);
      expect(unwrap(result)).toBe('NOT_LOWERCASE');
      expectTypeOf(Str.isLowerCase).toEqualTypeOf<
        (value: string) => Result<string, 'NOT_LOWERCASE'>
      >();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'NOT_LOWERCASE'>>();
    });
  });

  describe('isUpperCase', () => {
    it('should run example string-051: Validate uppercase string', () => {
      const result = Str.isUpperCase(validUpperCase);
      expect(unwrap(result)).toBe(validUpperCase);
      expectTypeOf(Str.isUpperCase).toEqualTypeOf<
        (value: string) => Result<string, 'NOT_UPPERCASE'>
      >();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'NOT_UPPERCASE'>>();
    });
    it('should run example string-052: Reject string with lowercase', () => {
      const result = Str.isUpperCase(invalidUpperCaseLower);
      expect(unwrap(result)).toBe('NOT_UPPERCASE');
      expectTypeOf(Str.isUpperCase).toEqualTypeOf<
        (value: string) => Result<string, 'NOT_UPPERCASE'>
      >();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'NOT_UPPERCASE'>>();
    });
    it('should run example string-053: Reject string with numbers', () => {
      const result = Str.isUpperCase(invalidUpperCaseNumbers);
      expect(unwrap(result)).toBe('NOT_UPPERCASE');
      expectTypeOf(Str.isUpperCase).toEqualTypeOf<
        (value: string) => Result<string, 'NOT_UPPERCASE'>
      >();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'NOT_UPPERCASE'>>();
    });
  });

  describe('isCapitalized', () => {
    it('should run example string-054: Validate capitalized string', () => {
      const result = Str.isCapitalized(validCapitalized);
      expect(unwrap(result)).toBe(validCapitalized);
      expectTypeOf(Str.isCapitalized).toEqualTypeOf<
        (value: string) => Result<string, 'NOT_CAPITALIZED'>
      >();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'NOT_CAPITALIZED'>>();
    });
    it('should run example string-055: Reject all lowercase string', () => {
      const result = Str.isCapitalized(invalidCapitalizedLower);
      expect(unwrap(result)).toBe('NOT_CAPITALIZED');
      expectTypeOf(Str.isCapitalized).toEqualTypeOf<
        (value: string) => Result<string, 'NOT_CAPITALIZED'>
      >();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'NOT_CAPITALIZED'>>();
    });
    it('should run example string-056: Reject all uppercase string', () => {
      const result = Str.isCapitalized(invalidCapitalizedUpper);
      expect(unwrap(result)).toBe('NOT_CAPITALIZED');
      expectTypeOf(Str.isCapitalized).toEqualTypeOf<
        (value: string) => Result<string, 'NOT_CAPITALIZED'>
      >();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'NOT_CAPITALIZED'>>();
    });
    it('should run example string-057: Reject multi-word string', () => {
      const result = Str.isCapitalized(invalidCapitalizedMulti);
      expect(unwrap(result)).toBe('NOT_CAPITALIZED');
      expectTypeOf(Str.isCapitalized).toEqualTypeOf<
        (value: string) => Result<string, 'NOT_CAPITALIZED'>
      >();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'NOT_CAPITALIZED'>>();
    });
  });

  describe('isStartsWith', () => {
    it('should run example string-058: Validate string starts with prefix', () => {
      const result = Str.isStartsWith('Hello')(validStartsWith);
      expect(unwrap(result)).toBe(validStartsWith);
      expectTypeOf(Str.isStartsWith).toEqualTypeOf<
        (prefix: string) => (value: string) => Result<string, 'NOT_STARTS_WITH'>
      >();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'NOT_STARTS_WITH'>>();
    });
    it('should run example string-059: Reject string not starting with prefix', () => {
      const result = Str.isStartsWith('Hello')(invalidStartsWith);
      expect(unwrap(result)).toBe('NOT_STARTS_WITH');
      expectTypeOf(Str.isStartsWith).toEqualTypeOf<
        (prefix: string) => (value: string) => Result<string, 'NOT_STARTS_WITH'>
      >();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'NOT_STARTS_WITH'>>();
    });
  });

  describe('isEndsWith', () => {
    it('should run example string-060: Validate string ends with suffix', () => {
      const result = Str.isEndsWith('World')(validEndsWith);
      expect(unwrap(result)).toBe(validEndsWith);
      expectTypeOf(Str.isEndsWith).toEqualTypeOf<
        (suffix: string) => (value: string) => Result<string, 'NOT_ENDS_WITH'>
      >();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'NOT_ENDS_WITH'>>();
    });
    it('should run example string-061: Reject string not ending with suffix', () => {
      const result = Str.isEndsWith('World')(invalidEndsWith);
      expect(unwrap(result)).toBe('NOT_ENDS_WITH');
      expectTypeOf(Str.isEndsWith).toEqualTypeOf<
        (suffix: string) => (value: string) => Result<string, 'NOT_ENDS_WITH'>
      >();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'NOT_ENDS_WITH'>>();
    });
  });

  describe('isBigInt', () => {
    it('should run example string-062: Validate BigInt string', () => {
      const result = Str.isBigInt(validBigIntString);
      expect(unwrap(result)).toBe(BigInt(validBigIntString));

      // Typechecking.
      expectTypeOf(Str.isBigInt).toEqualTypeOf<(value: string) => Result<bigint, 'NOT_BIGINT'>>();
      expectTypeOf(result).toEqualTypeOf<Result<bigint, 'NOT_BIGINT'>>();
    });

    it('should run example string-063: Reject invalid BigInt string', () => {
      const result = Str.isBigInt(invalidBigIntString);
      expect(unwrap(result)).toBe('NOT_BIGINT');

      // Typechecking.
      expectTypeOf(Str.isBigInt).toEqualTypeOf<(value: string) => Result<bigint, 'NOT_BIGINT'>>();
      expectTypeOf(result).toEqualTypeOf<Result<bigint, 'NOT_BIGINT'>>();
    });
  });

  describe('isInteger', () => {
    it('should run example string-064: Validate integer string', () => {
      const result = Str.isInteger(validIntegerString);
      expect(unwrap(result)).toBe(123456);

      // Typechecking.
      expectTypeOf(Str.isInteger).toEqualTypeOf<(value: string) => Result<number, 'NOT_INTEGER'>>();
      expectTypeOf(result).toEqualTypeOf<Result<number, 'NOT_INTEGER'>>();
    });

    it('should run example string-065: Reject invalid integer string', () => {
      const result = Str.isInteger(invalidIntegerString);
      expect(unwrap(result)).toBe('NOT_INTEGER');

      // Typechecking.
      expectTypeOf(Str.isInteger).toEqualTypeOf<(value: string) => Result<number, 'NOT_INTEGER'>>();
      expectTypeOf(result).toEqualTypeOf<Result<number, 'NOT_INTEGER'>>();
    });
  });

  describe('isBoolean', () => {
    it('should run example string-066: Validate boolean string', () => {
      const result = Str.isBoolean(validBooleanString);
      expect(unwrap(result)).toBe(true);

      // Typechecking.
      expectTypeOf(Str.isBoolean).toEqualTypeOf<
        (value: string) => Result<boolean, 'NOT_BOOLEAN'>
      >();
      expectTypeOf(result).toEqualTypeOf<Result<boolean, 'NOT_BOOLEAN'>>();
    });

    it('should run example string-067: Reject invalid boolean string', () => {
      const result = Str.isBoolean(invalidBooleanString);
      expect(unwrap(result)).toBe('NOT_BOOLEAN');

      // Typechecking.
      expectTypeOf(Str.isBoolean).toEqualTypeOf<
        (value: string) => Result<boolean, 'NOT_BOOLEAN'>
      >();
      expectTypeOf(result).toEqualTypeOf<Result<boolean, 'NOT_BOOLEAN'>>();
    });
  });

  describe('isNumber', () => {
    it('should run example string-068: Validate number string', () => {
      const result = Str.isNumber(validNumberString);
      expect(unwrap(result)).toBe(123.45);

      // Typechecking.
      expectTypeOf(Str.isNumber).toEqualTypeOf<(value: string) => Result<number, 'NOT_NUMBER'>>();
      expectTypeOf(result).toEqualTypeOf<Result<number, 'NOT_NUMBER'>>();
    });

    it('should run example string-069: Reject invalid number string', () => {
      const result = Str.isNumber(invalidNumberString);
      expect(unwrap(result)).toBe('NOT_NUMBER');

      // Typechecking.
      expectTypeOf(Str.isNumber).toEqualTypeOf<(value: string) => Result<number, 'NOT_NUMBER'>>();
      expectTypeOf(result).toEqualTypeOf<Result<number, 'NOT_NUMBER'>>();
    });
  });

  // *********************************************************************************************
  // Builder tests.
  // *********************************************************************************************

  describe('str builder', () => {
    it('should run example string-070: Basic string validation with type checking', () => {
      const stringValidator = Str.str.isString().isNotEmpty().build();

      const result = stringValidator('hello');
      expect(unwrap(result)).toBe('hello');
    });

    it('should run example string-071: Password validation with multiple constraints', () => {
      const passwordValidator = Str.str
        .isString()
        .hasMinLength(8)
        .hasMaxLength(50)
        .matches(/[A-Z]/) // Must contain uppercase
        .matches(/[a-z]/) // Must contain lowercase
        .matches(/\d/) // Must contain digit
        .build();

      const result = passwordValidator('SecurePass123');
      expect(unwrap(result)).toBe('SecurePass123');
    });

    it('should run example string-072: Username validation with specific requirements', () => {
      const usernameValidator = Str.str
        .isString()
        .hasMinLength(3)
        .hasMaxLength(20)
        .isAlphaNumeric()
        .build();

      const result = usernameValidator('john123');
      expect(unwrap(result)).toBe('john123');
    });

    it('should run example string-073: Color validation for CSS', () => {
      const colorValidator = Str.str
        .isString()
        .matches(/^#[0-9A-Fa-f]{6}$/) // Hex color
        .build();

      const result = colorValidator('#FF5733');
      expect(unwrap(result)).toBe('#FF5733');
    });

    it('should run example string-074: Slug validation for URLs', () => {
      const slugValidator = Str.str.isString().isSlug().hasMaxLength(100).build();

      const result = slugValidator('my-awesome-blog-post');
      expect(unwrap(result)).toBe('my-awesome-blog-post');
    });

    it('should run example string-075: Phone number validation with format checking', () => {
      const phoneValidator = Str.str.isString().isPhoneNumber().build();

      const result = phoneValidator('+1234567890');
      expect(unwrap(result)).toBe('+1234567890');
    });

    it('should run example string-076: Date validation for forms', () => {
      const dateValidator = Str.str.isString().isDate().build();

      const result = dateValidator('2024-01-15');
      expect(unwrap(result)).toBe('2024-01-15');
    });

    it('should run example string-077: Multiple validation with error collection', () => {
      const userValidator = Str.str.isString().isNotEmpty().hasMinLength(3).build('all'); // Collect all errors

      const result = userValidator('');
      expect(unwrap(result)).toEqual(['IS_EMPTY', 'TOO_SHORT']);
    });

    it('should handle builder chain with error cases', () => {
      const passwordValidator = Str.str
        .isString()
        .hasMinLength(8)
        .hasMaxLength(50)
        .matches(/[A-Z]/)
        .build();

      const weakPassword = passwordValidator('weak');
      expect(unwrap(weakPassword)).toBe('TOO_SHORT');

      const longPassword = passwordValidator('a'.repeat(60));
      expect(unwrap(longPassword)).toBe('TOO_LONG');

      const noUppercase = passwordValidator('password123');
      expect(unwrap(noUppercase)).toBe('NOT_MATCH');
    });

    it('should handle repeatable validations', () => {
      const multiValidator = Str.str
        .isString()
        .hasMinLength(5)
        .hasMaxLength(20)
        .hasMinLength(10) // This should override the previous minLength
        .hasMaxLength(15) // This should override the previous maxLength
        .build();

      const validResult = multiValidator('validstring');
      expect(unwrap(validResult)).toBe('validstring');

      const tooShort = multiValidator('short');
      expect(unwrap(tooShort)).toBe('TOO_SHORT');

      const tooLong = multiValidator('verylongstringthatisoverthelimit');
      expect(unwrap(tooLong)).toBe('TOO_LONG');
    });
  });
});
