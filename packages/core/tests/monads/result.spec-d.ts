import { describe, expect, expectTypeOf, it } from 'vitest';

import type { Err, Ok, Result } from '../../src/monads';
import { err, isOk, ok } from '../../src/monads/result';

describe('Result Type', () => {
  describe('Result', () => {
    it('should be a union of Ok and Err', () => {
      const result: Result<number, string> = ok(42);
      expectTypeOf<Ok<number> | Err<string>>(result);
    });

    it('should be a union of Ok and Err', () => {
      const result: Result<number, string> = err('ERROR');
      expectTypeOf<Ok<number> | Err<string>>(result);
    });
  });

  describe('ok', () => {
    it('should create a successful result with the given value', () => {
      const result = ok(42);
      expectTypeOf<Ok<number>>(result);
      expect(result._tag).toBe('Ok');
      expect(result.value).toBe(42);
    });

    it('should create a successful result with any type', () => {
      const result = ok({ name: 'test' });
      expectTypeOf<Ok<{ name: string }>>(result);
      expect(result._tag).toBe('Ok');
      expect(result.value).toEqual({ name: 'test' });
    });
  });

  describe('err', () => {
    it('should create a failed result with the given error', () => {
      const result = err('ERROR');
      expectTypeOf<Err<'ERROR'>>(result);
      expect(result._tag).toBe('Err');
      expect(result.error).toBe('ERROR');
    });

    it('should infer string literal types', () => {
      const result = err('NOT_FOUND');
      expectTypeOf<Err<'NOT_FOUND'>>(result);
      expect(result._tag).toBe('Err');
      expect(result.error).toBe('NOT_FOUND');
    });

    it('should narrow types correctly', () => {
      const result = ok(42);
      if (isOk(result)) {
        expectTypeOf<number>(result.value);
        // @ts-expect-error error should not exist on Ok.
        void result.error;
      }
    });
  });
});
