import { describe, expect, expectTypeOf, it } from 'vitest';

import { type Builder, BuilderError, builder } from '../src/builder';
import { type Result, err, isOk, ok } from '../src/result';

const unwrap = <T>(result: Result<T, unknown>) => (isOk(result) ? result.value : result.error);

describe('Builder', () => {
  // Test methods
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

  const stringMethods = {
    isString,
    minLength,
    maxLength,
    matches,
    toUpperCase,
  };

  describe('Basic functionality', () => {
    it('should create a builder with methods', () => {
      const string = builder(stringMethods);
      expect(string).toBeDefined();
      expect(typeof string.isString).toBe('function');
      expect(typeof string.minLength).toBe('function');
      expect(typeof string.maxLength).toBe('function');
      expect(typeof string.matches).toBe('function');
      expect(typeof string.toUpperCase).toBe('function');
      expect(typeof string.build).toBe('function');

      // Typechecking.
      expectTypeOf(string).toEqualTypeOf<
        Builder<string, string, never, never, typeof stringMethods, undefined>
      >();
    });

    it('should build a validator with no steps', () => {
      const string = builder(stringMethods);
      const validator = string.build();
      const result = validator('test');

      // Execution check.
      expect(unwrap(result)).toEqual('test');

      // Typechecking.
      expectTypeOf(validator).toEqualTypeOf<(input: string) => Result<string, never>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, never>>();
    });

    it('should build a validator with one step', () => {
      const string = builder(stringMethods);
      const validator = string.isString().build();
      const result = validator('test');

      // Execution check.
      expect(unwrap(result)).toEqual('test');

      // Typechecking.
      expectTypeOf(validator).toEqualTypeOf<(input: string) => Result<string, 'NOT_STRING'>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'NOT_STRING'>>();
    });

    it('should build a validator with multiple steps', () => {
      const string = builder(stringMethods);
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

    it('should handle transformation methods', () => {
      const string = builder(stringMethods);
      const validator = string.isString().toUpperCase().build();

      const result = validator('hello');

      // Execution check.
      expect(unwrap(result)).toEqual('HELLO');

      // Typechecking.
      expectTypeOf(validator).toEqualTypeOf<(input: string) => Result<string, 'NOT_STRING'>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'NOT_STRING'>>();
    });

    it('should handle methods with arguments', () => {
      const string = builder(stringMethods);
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

    it('should allow repeatable methods', () => {
      const string = builder(stringMethods, ['minLength']);
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
    it('should throw error for non-existent method', () => {
      const string = builder(stringMethods);
      let panic: BuilderError;

      try {
        // @ts-expect-error - This method is not defined.
        string.nonExistentMethod();
      } catch (error: unknown) {
        panic = error as BuilderError;
        expect(panic).toBeInstanceOf(BuilderError);
        expect(panic.key).toBe('BUILDER:METHOD_NOT_FOUND');
      }
    });

    it('should throw error for repeated non-repeatable method', () => {
      const string = builder(stringMethods);
      let panic: BuilderError;

      try {
        // @ts-expect-error - This method is not defined.
        string.isString().isString();
      } catch (error: unknown) {
        panic = error as BuilderError;
        expect(panic).toBeInstanceOf(BuilderError);
        expect(panic.key).toBe('BUILDER:METHOD_NOT_REPEATABLE');
      }
    });

    it('should throw error when method is missing from methods object during build', () => {
      // Manually create a builder with corrupted state where a method key exists in steps
      // but not in the methods object.
      const corruptedBuilder = builder(stringMethods, undefined, [
        { key: 'nonExistentMethod' as keyof typeof stringMethods, args: [] },
      ]);

      let panic: BuilderError;
      try {
        corruptedBuilder.build();
      } catch (error: unknown) {
        panic = error as BuilderError;
        expect(panic).toBeInstanceOf(BuilderError);
        expect(panic.key).toBe('BUILDER:CORRUPTED_METHOD');
      }
    });
  });

  describe('Edge cases', () => {
    it.todo('should handle empty methods object');
    it.todo('should handle methods that return errors');
    it.todo('should handle methods with different input/output types');
  });

  describe('Flow behavior', () => {
    it('should compose methods using flow', () => {
      const string = builder(stringMethods);
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
      const string = builder(stringMethods);
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
