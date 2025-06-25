import { describe, expect, expectTypeOf, it } from 'vitest';

import { type Builder, BuilderError, builder } from '../src/builder';
import { type Result, err, isOk, ok } from '../src/result';

const unwrap = <T>(result: Result<T, unknown>) => (isOk(result) ? result.value : result.error);

describe('Builder', () => {
  // Test functions.
  const isString = (value: string) => {
    if (typeof value !== 'string') {
      return err('NOT_STRING');
    }
    return ok(value);
  };

  const minLength = (length: number) => (value: string) => {
    if (value.length < length) {
      return err('TOO_SHORT');
    }
    return ok(value);
  };

  const maxLength = (length: number) => (value: string) => {
    if (value.length > length) {
      return err('TOO_LONG');
    }
    return ok(value);
  };

  const matches = (pattern: RegExp) => (value: string) => {
    if (!pattern.test(value)) {
      return err('DOES_NOT_MATCH');
    }
    return ok(value);
  };

  const toUpperCase = (value: string) => {
    return ok(value.toUpperCase());
  };

  const stringFunctions = {
    isString,
    minLength,
    maxLength,
    matches,
    toUpperCase,
  };

  describe('Basic functionality', () => {
    it('should create a builder with functions', () => {
      const string = builder(stringFunctions);
      expect(string).toBeDefined();
      expect(typeof string.isString).toBe('function');
      expect(typeof string.minLength).toBe('function');
      expect(typeof string.maxLength).toBe('function');
      expect(typeof string.matches).toBe('function');
      expect(typeof string.toUpperCase).toBe('function');
      expect(typeof string.build).toBe('function');

      // Typechecking.
      expectTypeOf(string).toEqualTypeOf<
        Builder<string, string, never, never, typeof stringFunctions, undefined>
      >();
    });

    it('should build a validator with no steps', () => {
      const string = builder(stringFunctions);
      const validator = string.build();
      const result = validator('test');

      // Execution check.
      expect(unwrap(result)).toEqual('test');

      // Typechecking.
      expectTypeOf(validator).toEqualTypeOf<(input: string) => Result<string, never>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, never>>();
    });

    it('should build a validator with one step', () => {
      const string = builder(stringFunctions);
      const validator = string.isString().build();
      const result = validator('test');

      // Execution check.
      expect(unwrap(result)).toEqual('test');

      // Typechecking.
      expectTypeOf(validator).toEqualTypeOf<(input: string) => Result<string, 'NOT_STRING'>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'NOT_STRING'>>();
    });

    it('should build a validator with multiple steps', () => {
      const string = builder(stringFunctions);
      const validator = string.isString().minLength(3).maxLength(10).build();

      const result1 = validator('hello');
      const result2 = validator('hi');
      const result3 = validator('very long string');

      // Execution check.
      expect(unwrap(result1)).toEqual('hello');
      expect(unwrap(result2)).toEqual('TOO_SHORT');
      expect(unwrap(result3)).toEqual('TOO_LONG');

      // Typechecking.
      expectTypeOf(validator).toEqualTypeOf<
        (input: string) => Result<string, 'NOT_STRING' | 'TOO_SHORT' | 'TOO_LONG'>
      >();
      expectTypeOf(result1).toEqualTypeOf<
        Result<string, 'NOT_STRING' | 'TOO_SHORT' | 'TOO_LONG'>
      >();
      expectTypeOf(result2).toEqualTypeOf<
        Result<string, 'NOT_STRING' | 'TOO_SHORT' | 'TOO_LONG'>
      >();
      expectTypeOf(result3).toEqualTypeOf<
        Result<string, 'NOT_STRING' | 'TOO_SHORT' | 'TOO_LONG'>
      >();
    });

    it('should handle transformation functions', () => {
      const string = builder(stringFunctions);
      const validator = string.isString().toUpperCase().build();

      const result = validator('hello');

      // Execution check.
      expect(unwrap(result)).toEqual('HELLO');

      // Typechecking.
      expectTypeOf(validator).toEqualTypeOf<(input: string) => Result<string, 'NOT_STRING'>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'NOT_STRING'>>();
    });

    it('should handle functions with arguments', () => {
      const string = builder(stringFunctions);
      const validator = string
        .isString()
        .minLength(3)
        .maxLength(10)
        .matches(/^[a-z]+$/)
        .build();

      const result1 = validator('hello');
      const result2 = validator('HELLO');

      // Execution check.
      expect(unwrap(result1)).toEqual('hello');
      expect(unwrap(result2)).toEqual('DOES_NOT_MATCH');

      // Typechecking.
      expectTypeOf(validator).toEqualTypeOf<
        (
          input: string,
        ) => Result<string, 'NOT_STRING' | 'TOO_SHORT' | 'TOO_LONG' | 'DOES_NOT_MATCH'>
      >();
      expectTypeOf(result1).toEqualTypeOf<
        Result<string, 'NOT_STRING' | 'TOO_SHORT' | 'TOO_LONG' | 'DOES_NOT_MATCH'>
      >();
      expectTypeOf(result2).toEqualTypeOf<
        Result<string, 'NOT_STRING' | 'TOO_SHORT' | 'TOO_LONG' | 'DOES_NOT_MATCH'>
      >();
    });

    it('should allow repeatable functions', () => {
      const string = builder(stringFunctions, ['minLength']);
      const validator = string.isString().minLength(3).minLength(5).build();

      const result1 = validator('hello');
      const result2 = validator('hi');

      // Execution check.
      expect(unwrap(result1)).toEqual('hello');
      expect(unwrap(result2)).toEqual('TOO_SHORT');

      // Typechecking.
      expectTypeOf(validator).toEqualTypeOf<
        (input: string) => Result<string, 'NOT_STRING' | 'TOO_SHORT'>
      >();
      expectTypeOf(result1).toEqualTypeOf<Result<string, 'NOT_STRING' | 'TOO_SHORT'>>();
      expectTypeOf(result2).toEqualTypeOf<Result<string, 'NOT_STRING' | 'TOO_SHORT'>>();
    });
  });

  describe('Error handling', () => {
    it('should throw error for non-existent function', () => {
      const string = builder(stringFunctions);
      let panic: BuilderError;

      try {
        // @ts-expect-error - This function is not defined.
        string.nonExistentFunction();
      } catch (error: unknown) {
        panic = error as BuilderError;
        expect(panic).toBeInstanceOf(BuilderError);
        expect(panic.key).toBe('BUILDER:FUNCTION_NOT_FOUND');
      }
    });

    it('should throw error for repeated non-repeatable function', () => {
      const string = builder(stringFunctions);
      let panic: BuilderError;

      try {
        // @ts-expect-error - This function is not defined.
        string.isString().isString();
      } catch (error: unknown) {
        panic = error as BuilderError;
        expect(panic).toBeInstanceOf(BuilderError);
        expect(panic.key).toBe('BUILDER:FUNCTION_NOT_REPEATABLE');
      }
    });

    it('should throw error when function is missing from functions object during build', () => {
      // Manually create a builder with corrupted state where a function key exists in steps
      // but not in the functions object.
      const corruptedBuilder = builder(stringFunctions, undefined, [
        { key: 'nonExistentFunction' as keyof typeof stringFunctions, args: [] },
      ]);

      let panic: BuilderError;
      try {
        corruptedBuilder.build();
      } catch (error: unknown) {
        panic = error as BuilderError;
        expect(panic).toBeInstanceOf(BuilderError);
        expect(panic.key).toBe('BUILDER:CORRUPTED_FUNCTION');
      }
    });
  });

  describe('Edge cases', () => {
    it.todo('should handle empty functions object');
    it.todo('should handle functions that return errors');
    it.todo('should handle functions with different input/output types');
  });

  describe('Flow behavior', () => {
    it('should compose functions using flow', () => {
      const string = builder(stringFunctions);
      const validator = string.isString().minLength(3).maxLength(10).toUpperCase().build();

      const result = validator('hello');

      // Execution check.
      expect(unwrap(result)).toEqual('HELLO');

      // Typechecking.
      expectTypeOf(validator).toEqualTypeOf<
        (input: string) => Result<string, 'NOT_STRING' | 'TOO_SHORT' | 'TOO_LONG'>
      >();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'NOT_STRING' | 'TOO_SHORT' | 'TOO_LONG'>>();
    });

    it('should stop execution on first error', () => {
      const string = builder(stringFunctions);
      const validator = string
        .isString()
        .minLength(10) // This will fail.
        .toUpperCase() // This should not execute.
        .build();

      const result = validator('hello');

      // Execution check.
      expect(unwrap(result)).toEqual('TOO_SHORT');

      // Typechecking.
      expectTypeOf(validator).toEqualTypeOf<
        (input: string) => Result<string, 'NOT_STRING' | 'TOO_SHORT'>
      >();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'NOT_STRING' | 'TOO_SHORT'>>();
    });
  });
});
