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
});
