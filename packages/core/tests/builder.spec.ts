import { describe, expect, expectTypeOf, it } from 'vitest';

import { type Builder, BuilderError, builder } from '../src/builder';
import type { Any } from '../src/generics';
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

  describe('Code examples', () => {
    it('should handle basic string validation example from documentation', () => {
      // Basic string validation builder
      const stringBuilder = builder({
        isString: (a: unknown) => (typeof a === 'string' ? ok(a) : err('NOT_STRING')),
        minLength: (length: number) => (a: string) =>
          a.length >= length ? ok(a) : err('TOO_SHORT'),
        maxLength: (length: number) => (a: string) =>
          a.length <= length ? ok(a) : err('TOO_LONG'),
      });

      // String validation rules
      const stringRules = stringBuilder.isString().minLength(3).maxLength(10).build();

      const r1 = stringRules('hello'); // ok('hello')
      const r2 = stringRules('hi'); // err('TOO_SHORT')
      const r3 = stringRules('very long string'); // err('TOO_LONG')

      // Assertions
      expect(unwrap(r1)).toBe('hello');
      expect(unwrap(r2)).toBe('TOO_SHORT');
      expect(unwrap(r3)).toBe('TOO_LONG');

      // Typechecking
      expectTypeOf(stringBuilder).toBeObject();
      expectTypeOf(stringRules).toBeFunction();
      expectTypeOf(stringRules).returns.toEqualTypeOf<
        Result<string, 'NOT_STRING' | 'TOO_SHORT' | 'TOO_LONG'>
      >();
      expectTypeOf(r1).toEqualTypeOf<Result<string, 'NOT_STRING' | 'TOO_SHORT' | 'TOO_LONG'>>();
      expectTypeOf(r2).toEqualTypeOf<Result<string, 'NOT_STRING' | 'TOO_SHORT' | 'TOO_LONG'>>();
      expectTypeOf(r3).toEqualTypeOf<Result<string, 'NOT_STRING' | 'TOO_SHORT' | 'TOO_LONG'>>();
    });

    it('should handle repeatable functions example from documentation', () => {
      // Builder with repeatable functions
      const stringBuilder = builder(
        {
          isString: (a: unknown) => (typeof a === 'string' ? ok(a) : err('NOT_STRING')),
          minLength: (length: number) => (a: string) =>
            a.length >= length ? ok(a) : err('TOO_SHORT'),
          maxLength: (length: number) => (a: string) =>
            a.length <= length ? ok(a) : err('TOO_LONG'),
          matches: (pattern: RegExp) => (a: string) =>
            pattern.test(a) ? ok(a) : err('DOES_NOT_MATCH'),
        },
        ['minLength', 'maxLength'],
      ); // minLength and maxLength can be repeated

      // Multiple length validations
      const validator = stringBuilder
        .isString()
        .minLength(3)
        .minLength(5) // This is allowed because minLength is repeatable
        .maxLength(10)
        .matches(/^[a-z]+$/)
        .build();

      const result = validator('hello'); // ok('hello')

      // Assertions
      expect(unwrap(result)).toBe('hello');

      // Typechecking
      expectTypeOf(stringBuilder).toBeObject();
      expectTypeOf(validator).toBeFunction();
      expectTypeOf(validator).returns.toEqualTypeOf<
        Result<string, 'NOT_STRING' | 'TOO_SHORT' | 'TOO_LONG' | 'DOES_NOT_MATCH'>
      >();
      expectTypeOf(result).toEqualTypeOf<
        Result<string, 'NOT_STRING' | 'TOO_SHORT' | 'TOO_LONG' | 'DOES_NOT_MATCH'>
      >();
    });

    it('should handle type transformations example from documentation', () => {
      // Builder with string transformations (same type)
      const stringBuilder = builder({
        isString: (a: unknown) => (typeof a === 'string' ? ok(a) : err('NOT_STRING')),
        trim: (a: string) => ok(a.trim()),
        toUpperCase: (a: string) => ok(a.toUpperCase()),
        replace: (search: string, replace: string) => (a: string) => ok(a.replace(search, replace)),
      });

      // Transform string while maintaining type
      const transformer = stringBuilder
        .isString()
        .trim()
        .toUpperCase()
        .replace('HELLO', 'HI')
        .build();

      const result = transformer('  hello world  '); // ok('HI WORLD')

      // Assertions
      expect(unwrap(result)).toBe('HI WORLD');

      // Typechecking
      expectTypeOf(stringBuilder).toBeObject();
      expectTypeOf(transformer).toBeFunction();
      expectTypeOf(transformer).returns.toEqualTypeOf<Result<string, 'NOT_STRING'>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'NOT_STRING'>>();
    });

    it('should handle different error modes example from documentation', () => {
      // Builder with different error modes (same type)
      const stringBuilder = builder({
        isString: (a: unknown) => (typeof a === 'string' ? ok(a) : err('NOT_STRING')),
        nonEmpty: (a: string) => (a.length > 0 ? ok(a) : err('EMPTY_STRING')),
        alphanumeric: (a: string) => (/^[a-zA-Z0-9]+$/.test(a) ? ok(a) : err('NOT_ALPHANUMERIC')),
        noSpaces: (a: string) => (!a.includes(' ') ? ok(a) : err('CONTAINS_SPACES')),
      });

      // Strict mode (default) - stops at first error
      const strictValidator = stringBuilder
        .isString()
        .nonEmpty()
        .alphanumeric()
        .noSpaces()
        .build('strict');

      const strictResult = strictValidator(''); // err('EMPTY_STRING') - stops here

      // All mode - collects all errors
      const allValidator = stringBuilder
        .isString()
        .nonEmpty()
        .alphanumeric()
        .noSpaces()
        .build('all');

      const allResult = allValidator(' a@b '); // err(['NOT_ALPHANUMERIC', 'CONTAINS_SPACES'])

      // Assertions
      expect(unwrap(strictResult)).toBe('EMPTY_STRING');
      expect(unwrap(allResult)).toEqual(['NOT_ALPHANUMERIC', 'CONTAINS_SPACES']);

      // Typechecking
      expectTypeOf(stringBuilder).toBeObject();
      expectTypeOf(strictValidator).toBeFunction();
      expectTypeOf(allValidator).toBeFunction();
      expectTypeOf(strictResult).toBeObject();
      expectTypeOf(allResult).toBeObject();
    });
  });

  describe('BuilderError examples', () => {
    it('should handle CORRUPTED_FUNCTION example from documentation', () => {
      const stringBuilder = builder({
        isString: (a: unknown) => (typeof a === 'string' ? ok(a) : err('NOT_STRING')),
      });

      // This would throw CORRUPTED_FUNCTION if the function was missing
      const validator = stringBuilder.isString().build();

      // Assertions - this should work normally
      const result = validator('hello');
      expect(unwrap(result)).toBe('hello');

      // Typechecking
      expectTypeOf(stringBuilder).toBeObject();
      expectTypeOf(validator).toBeFunction();
      expectTypeOf(result).toEqualTypeOf<Result<string, 'NOT_STRING'>>();
    });

    it('should handle FUNCTION_NOT_FOUND example from documentation', () => {
      const stringBuilder = builder({
        isString: (a: unknown) => (typeof a === 'string' ? ok(a) : err('NOT_STRING')),
      });

      let panic: BuilderError;
      try {
        (stringBuilder as Any).nonExistentFunction();
      } catch (error: unknown) {
        panic = error as BuilderError;
        expect(panic).toBeInstanceOf(BuilderError);
        expect(panic.key).toBe('BUILDER:FUNCTION_NOT_FOUND');
      }

      // Typechecking
      expectTypeOf(stringBuilder).toBeObject();
    });

    it('should handle FUNCTION_NOT_REPEATABLE example from documentation', () => {
      const stringBuilder = builder({
        isString: (a: unknown) => (typeof a === 'string' ? ok(a) : err('NOT_STRING')),
        minLength: (length: number) => (a: string) =>
          a.length >= length ? ok(a) : err('TOO_SHORT'),
      });

      let panic: BuilderError;
      try {
        (stringBuilder as Any).isString().isString();
      } catch (error: unknown) {
        panic = error as BuilderError;
        expect(panic).toBeInstanceOf(BuilderError);
        expect(panic.key).toBe('BUILDER:FUNCTION_NOT_REPEATABLE');
      }

      // Typechecking
      expectTypeOf(stringBuilder).toBeObject();
    });
  });

  describe('BuilderMode examples', () => {
    it('should handle strict mode example from documentation', () => {
      // Strict mode (default) - stops at first error
      const stringBuilder = builder({
        isString: (a: unknown) => (typeof a === 'string' ? ok(a) : err('NOT_STRING')),
        nonEmpty: (a: string) => (a.length > 0 ? ok(a) : err('EMPTY_STRING')),
        alphanumeric: (a: string) => (/^[a-zA-Z0-9]+$/.test(a) ? ok(a) : err('NOT_ALPHANUMERIC')),
        noSpaces: (a: string) => (!a.includes(' ') ? ok(a) : err('CONTAINS_SPACES')),
      });

      const strictValidator = stringBuilder
        .isString()
        .nonEmpty()
        .alphanumeric()
        .noSpaces()
        .build('strict');

      const strictResult = strictValidator(''); // err('EMPTY_STRING') - stops at first error

      // Assertions
      expect(unwrap(strictResult)).toBe('EMPTY_STRING');

      // Typechecking
      expectTypeOf(stringBuilder).toBeObject();
      expectTypeOf(strictValidator).toBeFunction();
      expectTypeOf(strictResult).toBeObject();
    });

    it('should handle all mode example from documentation', () => {
      // All mode - collects all errors
      const stringBuilder = builder({
        isString: (a: unknown) => (typeof a === 'string' ? ok(a) : err('NOT_STRING')),
        nonEmpty: (a: string) => (a.length > 0 ? ok(a) : err('EMPTY_STRING')),
        alphanumeric: (a: string) => (/^[a-zA-Z0-9]+$/.test(a) ? ok(a) : err('NOT_ALPHANUMERIC')),
        noSpaces: (a: string) => (!a.includes(' ') ? ok(a) : err('CONTAINS_SPACES')),
      });

      const allValidator = stringBuilder
        .isString()
        .nonEmpty()
        .alphanumeric()
        .noSpaces()
        .build('all');

      const allResult = allValidator(' a@b '); // err(['NOT_ALPHANUMERIC', 'CONTAINS_SPACES'])

      // Assertions
      expect(unwrap(allResult)).toEqual(['NOT_ALPHANUMERIC', 'CONTAINS_SPACES']);

      // Typechecking
      expectTypeOf(stringBuilder).toBeObject();
      expectTypeOf(allValidator).toBeFunction();
      expectTypeOf(allResult).toBeObject();
    });
  });
});
