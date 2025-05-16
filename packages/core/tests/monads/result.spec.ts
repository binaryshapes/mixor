import { expectType } from 'tsd';

import type { Err, Result } from '../../src/monads/result';
import { err, isErr, isOk, ok } from '../../src/monads/result';

describe('Result Monad', () => {
  describe('ok', () => {
    it('should create a successful result with the given value', () => {
      const result = ok(42);
      expectType<Result<number, never>>(result);
      expect(result._tag).toBe('Ok');
      expect(result.value).toBe(42);
    });

    it('should create a successful result with any type', () => {
      const result = ok({ name: 'test' });
      expectType<Result<{ name: string }, never>>(result);
      expect(result._tag).toBe('Ok');
      expect(result.value).toEqual({ name: 'test' });
    });
  });

  describe('err', () => {
    it('should create a failed result with the given error', () => {
      const result = err('ERROR');
      expectType<Err<'ERROR'>>(result);
      expect(result._tag).toBe('Err');
      expect(result.error).toBe('ERROR');
    });

    it('should infer string literal types', () => {
      const result = err('NOT_FOUND');
      expectType<Err<'NOT_FOUND'>>(result);
      expect(result._tag).toBe('Err');
      expect(result.error).toBe('NOT_FOUND');
    });

    it('should fail to compile with non-string errors', () => {
      // @ts-expect-error Error must be a string
      void err(42);
    });
  });

  describe('isOk', () => {
    it('should return true for Ok values', () => {
      const result = ok(42);
      expect(isOk(result)).toBe(true);
    });

    it('should return false for Err values', () => {
      const result = err('ERROR');
      expect(isOk(result)).toBe(false);
    });

    it('should narrow the type when used as a type guard', () => {
      const result = ok(42);
      if (isOk(result)) {
        expect(result.value).toBe(42);
      }
    });

    it('should narrow types correctly', () => {
      const result = ok(42);
      if (isOk(result)) {
        expectType<number>(result.value);
        // @ts-expect-error error should not exist on Ok.
        void result.error;
      }
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
      }
    });

    it('should narrow types correctly', () => {
      const result = err('ERROR');
      if (isErr(result)) {
        expectType<string>(result.error);
        // @ts-expect-error value should not exist on Err.
        void result.value;
      }
    });
  });
});
