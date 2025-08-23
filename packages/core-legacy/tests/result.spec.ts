import { describe, expect, expectTypeOf, it } from 'vitest';

import { type Result, err, isErr, isOk, isResult, ok } from '../src/result';

describe('Result', () => {
  describe('isOk', () => {
    it('should return true for Ok values', () => {
      const result = ok(42);
      expect(isOk(result)).toBe(true);

      // Typechecking.
      expectTypeOf(result).toEqualTypeOf<Result<number, never>>();
    });

    it('should return false for Err values', () => {
      const result = err('ERROR');
      expect(isOk(result)).toBe(false);

      // Typechecking.
      expectTypeOf(result).toEqualTypeOf<Result<never, 'ERROR'>>();
    });

    it('should narrow the type when used as a type guard', () => {
      const result = ok(42);
      if (isOk(result)) {
        expect(result.value).toBe(42);
        expect(result._tag).toBe('Ok');
        // @ts-expect-error error should not exist on Ok.
        void result.error;
      }

      // Typechecking.
      expectTypeOf(result).toEqualTypeOf<Result<number, never>>();
    });
  });

  describe('isErr', () => {
    it('should return true for Err values', () => {
      const result = err('ERROR');
      expect(isErr(result)).toBe(true);
    });

    it('should return false for Ok values', () => {
      const result = ok(42);
      expect(isErr(result)).toBe(false);
    });

    it('should narrow the type when used as a type guard', () => {
      const result = err('ERROR');
      if (isErr(result)) {
        expect(result.error).toBe('ERROR');
        expect(result._tag).toBe('Err');
        // @ts-expect-error value should not exist on Err.
        void result.value;
      }

      // Typechecking.
      expectTypeOf(result).toEqualTypeOf<Result<never, 'ERROR'>>();
    });
  });

  describe('isResult', () => {
    it('should return true for Ok values', () => {
      const result = ok(42);
      expect(isResult(result)).toBe(true);

      // Typechecking.
      expectTypeOf(result).toEqualTypeOf<Result<number, never>>();
    });

    it('should return true for Err values', () => {
      const result = err('ERROR');
      expect(isResult(result)).toBe(true);

      // Typechecking.
      expectTypeOf(result).toEqualTypeOf<Result<never, 'ERROR'>>();
    });

    it('should return false for other values', () => {
      const result = { value: 42 };
      expect(isResult(result)).toBe(false);

      // Typechecking.
      expectTypeOf(result).toEqualTypeOf<{ value: number }>();
    });

    it('should return false with null and undefined', () => {
      expect(isResult(null)).toBe(false);
      expect(isResult(undefined)).toBe(false);
    });

    it('should narrow the type when used as a type guard', () => {
      const result = ok(42);
      if (isResult(result)) {
        void result._tag;
        if (isOk(result)) {
          expect(result.value).toBe(42);
        } else {
          expect(result._tag).toBe('Err');
          expect(result.error).toBe('ERROR');
        }
      }
    });
  });
});
