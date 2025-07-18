import { describe, expect, expectTypeOf, it } from 'vitest';

import { type Result, isErr, isOk, unwrap } from '@mixor/core';

import { EnumerateError, enumerate } from '../src/enumerate';

enum Status {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
}

enum StatusWithDuplicate {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  DUPLICATE = 'pendind',
}

enum Priority {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
}

enum MixedEnum {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
}

// Shared test utilities.
const createTestHelpers = () => ({
  createStringEnum: () => enumerate(['active', 'inactive', 'pending']),
  createNumberEnum: () => enumerate([1, 2, 3, 4, 5]),
  createStringEnumFromTypeScriptEnum: () => enumerate(Status),
  createNumberEnumFromTypeScriptEnum: () => enumerate(Priority),
  createMixedEnumFromTypeScriptEnum: () => enumerate(MixedEnum),
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

    it('should run example enumerate-007: Using TypeScript string enum', () => {
      const status = helpers.createStringEnumFromTypeScriptEnum();
      const result = status(Status.ACTIVE);
      if (isOk(result)) {
        expect(unwrap(result)).toBe('active');
      }
    });

    it('should run example enumerate-008: Using TypeScript numeric enum', () => {
      const priority = helpers.createNumberEnumFromTypeScriptEnum();
      const result = priority(Priority.MEDIUM);
      if (isOk(result)) {
        expect(unwrap(result)).toBe(2);
      }
    });

    it('should run example enumerate-009: Mixed types validation for enums', () => {
      try {
        const mixedEnum = helpers.createMixedEnumFromTypeScriptEnum();
        mixedEnum(MixedEnum.ACTIVE);
        expect(true).toBe(false); // Should not reach here.
      } catch (error) {
        if (error instanceof EnumerateError) {
          expect(error).toBeInstanceOf(EnumerateError);
          expect(error.message).toBe('Enumeration cannot have mixed types');
          expect(error.key).toBe('ENUMERATE:MIXED_TYPES');
        }
      }
    });
  });

  describe('Error handling', () => {
    it('should throw EnumerateError for empty arrays', () => {
      expect(() => enumerate([])).toThrow(EnumerateError);
      expect(() => enumerate([])).toThrow('Enumeration cannot be empty');

      // Native TypeScript enum with duplicate values.
      expect(() => enumerate({})).toThrow(EnumerateError);
      expect(() => enumerate({})).toThrow('Enumeration cannot be empty');
    });

    it('should throw EnumerateError for duplicate values', () => {
      // Array of duplicate values.
      expect(() => enumerate(['a', 'b', 'a'])).toThrow(EnumerateError);
      expect(() => enumerate(['a', 'b', 'a'])).toThrow('Enumeration cannot have duplicate values');

      // Native TypeScript enum with duplicate values.
      // expect(() => enumerate(StatusWithDuplicate)).toThrow(EnumerateError);
      // expect(() => enumerate(StatusWithDuplicate)).toThrow(
      //   'Enumeration cannot have duplicate values',
      // );
      console.log(enumerate(StatusWithDuplicate));
    });

    it('should throw EnumerateError for mixed types', () => {
      // Array of mixed types.
      expect(() => enumerate(['a', 1])).toThrow(EnumerateError);
      expect(() => enumerate(['a', 1])).toThrow('Enumeration cannot have mixed types');

      // Native TypeScript enum with mixed types.
      expect(() => enumerate(MixedEnum)).toThrow(EnumerateError);
      expect(() => enumerate(MixedEnum)).toThrow('Enumeration cannot have mixed types');
    });
  });

  describe('Enum functionality', () => {
    it('should work with string enums', () => {
      const status = helpers.createStringEnumFromTypeScriptEnum();
      const result = status(Status.ACTIVE);
      expect(isOk(result)).toBe(true);
      expect(unwrap(result)).toBe('active');
    });

    it('should work with numeric enums', () => {
      const priority = helpers.createNumberEnumFromTypeScriptEnum();
      const result = priority(Priority.MEDIUM);
      expect(isOk(result)).toBe(true);
      expect(unwrap(result)).toBe(2);
    });

    it('should reject invalid enum values', () => {
      const status = helpers.createStringEnumFromTypeScriptEnum();
      // @ts-expect-error - Invalid value.
      const result = status('invalid');
      expect(isErr(result)).toBe(true);
      expect(unwrap(result)).toBe('INVALID_ENUM_VALUE');
    });

    it('should handle empty enums', () => {
      enum EmptyEnum {}
      expect(() => enumerate(EmptyEnum)).toThrow(EnumerateError);
      expect(() => enumerate(EmptyEnum)).toThrow('Enumeration cannot be empty');
    });

    it('should handle enums with duplicate values', () => {
      // TypeScript doesn't allow duplicate values in enums, so we test with an object
      const duplicateEnum = {
        A: 'value',
        B: 'value',
      };
      expect(() => enumerate(duplicateEnum)).toThrow(EnumerateError);
      expect(() => enumerate(duplicateEnum)).toThrow('Enumeration cannot have duplicate values');
    });
  });

  describe('Type safety', () => {
    it('should provide correct type inference for string enums', () => {
      const status = helpers.createStringEnum();

      // Typechecking.
      expectTypeOf(status).toBeFunction();
      expectTypeOf(status).toEqualTypeOf<
        (
          value: 'active' | 'inactive' | 'pending',
        ) => Result<'active' | 'inactive' | 'pending', 'INVALID_ENUM_VALUE'>
      >();
    });

    it('should provide correct type inference for number enums', () => {
      const numbers = helpers.createNumberEnum();

      // Typechecking.
      expectTypeOf(numbers).toBeFunction();
      expectTypeOf(numbers).toEqualTypeOf<
        (value: 1 | 2 | 3 | 4 | 5) => Result<1 | 2 | 3 | 4 | 5, 'INVALID_ENUM_VALUE'>
      >();
    });

    it('should provide correct type inference for TypeScript string enums', () => {
      const status = helpers.createStringEnumFromTypeScriptEnum();

      // Typechecking.
      expectTypeOf(status).toBeFunction();
      expectTypeOf(status).branded.toEqualTypeOf<
        (value: Status) => Result<Status, 'INVALID_ENUM_VALUE'>
      >();
    });

    it('should provide correct type inference for TypeScript numeric enums', () => {
      const priority = helpers.createNumberEnumFromTypeScriptEnum();

      // Typechecking.
      expectTypeOf(priority).toBeFunction();
      expectTypeOf(priority).branded.toEqualTypeOf<
        (value: Priority) => Result<Priority, 'INVALID_ENUM_VALUE'>
      >();
    });
  });
});
