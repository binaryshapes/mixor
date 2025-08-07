import { describe, expect, expectTypeOf, it } from 'vitest';

import { type Result, isTraceable, unwrap } from '@mixor/core';

import { coerceString, isString } from '../src/string';

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
