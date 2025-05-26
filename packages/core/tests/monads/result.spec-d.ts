import { describe, expectTypeOf, it } from 'vitest';

import { type Err, type Ok, type Result, err, ok } from '../../src/monads';

describe('Result Type', () => {
  describe('result', () => {
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
      expectTypeOf<Result<number, never>>(result);
    });

    it('should create a successful result with any type', () => {
      const result = ok({ name: 'test' });
      expectTypeOf<Result<{ name: string }, never>>(result);
    });
  });

  describe('err', () => {
    it('should create a failed result with the given error', () => {
      const result = err('ERROR');
      expectTypeOf<Result<never, 'ERROR'>>(result);
    });

    it('should infer string literal types', () => {
      const result = err('NOT_FOUND');
      expectTypeOf<Result<never, 'NOT_FOUND'>>(result);
    });
  });
});
