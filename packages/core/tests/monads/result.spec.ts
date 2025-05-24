import { describe, expect, it } from 'vitest';

import { err, isErr, isOk, ok } from '../../src/monads/result';

describe('Result Monad', () => {
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
        // @ts-expect-error value should not exist on Err.
        void result.value;
      }
    });
  });
});
