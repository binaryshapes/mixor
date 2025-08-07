import { describe, expect, expectTypeOf, it } from 'vitest';

import { type Result, isTraceable, unwrap } from '@mixor/core';

import { coerceString, hasMaxLength, hasMinLength, isNotEmpty, isString } from '../src/string';

describe('String value', () => {
  describe('isString rule', () => {
    describe('Type safety', () => {
      it('should be traceable', () => {
        expect(isTraceable(isString)).toBe(true);
      });

      it('should provide correct type inference for all public elements', () => {
        expectTypeOf(isString).toBeFunction();
        expectTypeOf(isString('hello')).toEqualTypeOf<
          Result<string, { code: 'NOT_STRING'; context: 'isString'; message?: string }>
        >();
      });
    });

    describe('Code examples', () => {
      it('should run example is-string-001: Validate string value', () => {
        const result = isString('hello');
        expect(unwrap(result)).toBe('hello');
      });

      it('should run example is-string-002: Reject number value', () => {
        // @ts-expect-error - This is a test case.
        const result = isString(1.23);
        expect(unwrap(result)).toEqual({
          code: 'NOT_STRING',
          context: 'isString',
          message: '1.23 is not string',
        });
      });

      it('should run example is-string-003: Reject boolean value', () => {
        // @ts-expect-error - This is a test case.
        const result = isString(true);
        expect(unwrap(result)).toEqual({
          code: 'NOT_STRING',
          context: 'isString',
          message: 'true is not string',
        });
      });

      it('should run example is-string-004: Reject null value', () => {
        // @ts-expect-error - This is a test case.
        const result = isString(null);
        expect(unwrap(result)).toEqual({
          code: 'NOT_STRING',
          context: 'isString',
          message: 'null is not string',
        });
      });

      it('should run example is-string-005: Reject undefined value', () => {
        // @ts-expect-error - This is a test case.
        const result = isString(undefined);
        expect(unwrap(result)).toEqual({
          code: 'NOT_STRING',
          context: 'isString',
          message: 'undefined is not string',
        });
      });

      it('should run example is-string-006: Reject object value', () => {
        // @ts-expect-error - This is a test case.
        const result = isString({});
        expect(unwrap(result)).toEqual({
          code: 'NOT_STRING',
          context: 'isString',
          message: '[object Object] is not string',
        });
      });

      it('should run example is-string-007: Reject array value', () => {
        // @ts-expect-error - This is a test case.
        const result = isString([]);
        expect(unwrap(result)).toEqual({
          code: 'NOT_STRING',
          context: 'isString',
          message: ' is not string',
        });
      });
    });

    describe('isNotEmpty rule', () => {
      describe('Type safety', () => {
        it('should provide correct type inference for all public elements', () => {
          expectTypeOf(isNotEmpty).toBeFunction();
          expect(isTraceable(isNotEmpty)).toBe(true);
        });
      });

      describe('Code examples', () => {
        it('should run example is-not-empty-001: Validate non-empty string', () => {
          const result = isNotEmpty('hello');
          expect(unwrap(result)).toBe('hello');
        });

        it('should run example is-not-empty-002: Reject empty string', () => {
          const result = isNotEmpty('');
          expect(unwrap(result)).toEqual({
            code: 'IS_EMPTY',
            context: 'isNotEmpty',
            message: 'String should not be empty',
          });
        });
      });
    });

    describe('hasMinLength rule', () => {
      describe('Type safety', () => {
        it('should provide correct type inference for all public elements', () => {
          expectTypeOf(hasMinLength).toBeFunction();
          expectTypeOf(hasMinLength(5)).toBeFunction();
          expect(isTraceable(hasMinLength(5))).toBe(true);
        });
      });

      describe('Code examples', () => {
        it('should run example has-min-length-001: Validate string with minimum length', () => {
          const result = hasMinLength(10)('hello world');
          expect(unwrap(result)).toBe('hello world');
        });

        it('should run example has-min-length-002: Reject string with insufficient length', () => {
          const result = hasMinLength(10)('short');
          expect(unwrap(result)).toEqual({
            code: 'TOO_SHORT',
            context: 'hasMinLength',
            message: 'String length 5 is less than minimum 10',
          });
        });
      });
    });

    describe('hasMaxLength rule', () => {
      describe('Type safety', () => {
        it('should provide correct type inference for all public elements', () => {
          expectTypeOf(hasMaxLength).toBeFunction();
          expectTypeOf(hasMaxLength(10)).toBeFunction();
          expect(isTraceable(hasMaxLength(10))).toBe(true);
        });
      });

      describe('Code examples', () => {
        it('should run example has-max-length-001: Validate string with maximum length', () => {
          const result = hasMaxLength(10)('short');
          expect(unwrap(result)).toBe('short');
        });

        it('should run example has-max-length-002: Reject string exceeding maximum length', () => {
          const result = hasMaxLength(10)('too long string');
          expect(unwrap(result)).toEqual({
            code: 'TOO_LONG',
            context: 'hasMaxLength',
            message: 'String length 15 exceeds maximum 10',
          });
        });
      });
    });
  });

  describe('coerceString rule', () => {
    describe('Type safety', () => {
      it('should be traceable', () => {
        expect(isTraceable(coerceString)).toBe(true);
      });

      it('should provide correct type inference for all public elements', () => {
        expectTypeOf(coerceString).toBeFunction();
        expectTypeOf(coerceString('hello')).toEqualTypeOf<Result<string, never>>();
        // @ts-expect-error - This is a test case.
        expectTypeOf(coerceString(123)).toEqualTypeOf<Result<string, never>>();
      });
    });

    describe('Code examples', () => {
      it('should run example coerce-string-001: Coerce string value', () => {
        const result = coerceString('hello');
        expect(unwrap(result)).toBe('hello');
      });

      it('should run example coerce-string-002: Coerce number to string', () => {
        // @ts-expect-error - This is a test case.
        const result = coerceString(123);
        expect(unwrap(result)).toBe('123');
      });
    });
  });
});
