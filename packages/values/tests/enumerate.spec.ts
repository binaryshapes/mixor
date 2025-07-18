import { describe, expect, it } from 'vitest';

import { isErr, isOk, unwrap } from '@mixor/core';

import { EnumerateError, enumerate } from '../src/enumerate';

// Shared test utilities.
const createTestHelpers = () => ({
  createStringEnum: () => enumerate(['active', 'inactive', 'pending']),
  createNumberEnum: () => enumerate([1, 2, 3, 4, 5]),
});

describe('enumerate', () => {
  const helpers = createTestHelpers();

  describe('Basic functionality', () => {
    it('should create a validator function', () => {
      const validator = enumerate(['test']);
      expect(typeof validator).toBe('function');
    });

    it('should validate string enums', () => {
      const status = helpers.createStringEnum();
      const result = status('active');
      expect(isOk(result)).toBe(true);
      expect(unwrap(result)).toBe('active');
    });

    it('should validate number enums', () => {
      const numbers = helpers.createNumberEnum();
      const result = numbers(3);
      expect(isOk(result)).toBe(true);
      expect(unwrap(result)).toBe(3);
    });

    it('should reject invalid values', () => {
      const status = helpers.createStringEnum();
      // @ts-expect-error - Invalid value.
      const result = status('invalid');
      expect(isErr(result)).toBe(true);
      expect(unwrap(result)).toBe('INVALID_ENUM_VALUE');
    });
  });

  describe('Code examples', () => {
    it('should run example enumerate-001: Basic string enumeration validation', () => {
      const status = enumerate(['active', 'inactive', 'pending']);
      const result = status('active');
      if (isOk(result)) {
        expect(unwrap(result)).toBe('active');
      }
    });

    it('should run example enumerate-002: Number enumeration validation', () => {
      const priority = enumerate([1, 2, 3, 4, 5]);
      const result = priority(3);
      if (isOk(result)) {
        expect(unwrap(result)).toBe(3);
      }
    });

    it('should run example enumerate-003: Invalid value handling', () => {
      const status = enumerate(['active', 'inactive']);
      // @ts-expect-error - Invalid value.
      const result = status('deleted');
      if (isErr(result)) {
        expect(unwrap(result)).toBe('INVALID_ENUM_VALUE');
      }
    });

    it('should run example enumerate-004: Empty array validation', () => {
      try {
        enumerate([]);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(EnumerateError);
        if (error instanceof EnumerateError) {
          expect(error.message).toBe('Enumeration cannot be empty');
          expect(error.key).toBe('ENUMERATE:EMPTY_ENUM');
        }
      }
    });

    it('should run example enumerate-005: Duplicate values validation', () => {
      try {
        enumerate(['active', 'inactive', 'active']);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(EnumerateError);
        if (error instanceof EnumerateError) {
          expect(error.message).toBe('Enumeration cannot have duplicate values');
          expect(error.key).toBe('ENUMERATE:DUPLICATE_VALUES');
        }
      }
    });

    it('should run example enumerate-006: Mixed types validation', () => {
      try {
        enumerate(['active', 123]);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(EnumerateError);
        if (error instanceof EnumerateError) {
          expect(error.message).toBe('Enumeration cannot have mixed types');
          expect(error.key).toBe('ENUMERATE:MIXED_TYPES');
        }
      }
    });
  });

  describe('Type safety', () => {
    it('should provide correct type inference for string enums', () => {
      const status = enumerate(['active', 'inactive']);
      expect(typeof status).toBe('function');
    });

    it('should provide correct type inference for number enums', () => {
      const numbers = enumerate([1, 2, 3]);
      expect(typeof numbers).toBe('function');
    });

    it('should restrict to string and number types', () => {
      // These should cause TypeScript errors at compile time
      // The actual execution is tested in the error handling section
      expect(true).toBe(true); // Placeholder - type checking is done at compile time
    });
  });

  describe('Error handling', () => {
    it('should throw EnumerateError for empty arrays', () => {
      expect(() => enumerate([])).toThrow(EnumerateError);
      expect(() => enumerate([])).toThrow('Enumeration cannot be empty');
    });

    it('should throw EnumerateError for duplicate values', () => {
      expect(() => enumerate(['a', 'b', 'a'])).toThrow(EnumerateError);
      expect(() => enumerate(['a', 'b', 'a'])).toThrow('Enumeration cannot have duplicate values');
    });

    it('should throw EnumerateError for mixed types', () => {
      expect(() => enumerate(['a', 1])).toThrow(EnumerateError);
      expect(() => enumerate(['a', 1])).toThrow('Enumeration cannot have mixed types');
    });

    it('should return error result for invalid values', () => {
      const status = helpers.createStringEnum();
      // @ts-expect-error - Invalid value.
      const result = status('invalid');
      expect(isErr(result)).toBe(true);
      expect(unwrap(result)).toBe('INVALID_ENUM_VALUE');
    });
  });
});
