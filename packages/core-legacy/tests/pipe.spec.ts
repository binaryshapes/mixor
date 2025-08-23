import { describe, expect, expectTypeOf, it } from 'vitest';

import { type Any } from '../src/generics';
import { pipe } from '../src/pipe';
import { type Result, err, ok, unwrap } from '../src/result';

describe('Pipe', () => {
  describe('Classic pipeline', () => {
    it('should create a single function pipeline', () => {
      const addOne = (x: number) => x + 1;
      const pipeline = pipe(addOne);
      expect(pipeline(1)).toBe(2);

      // Typechecking.
      expectTypeOf(pipeline).toBeFunction();
      expectTypeOf(pipeline).parameter(0).toBeNumber();
      expectTypeOf(pipeline).returns.toBeNumber();
    });

    it('should create a two function pipeline', () => {
      const addOne = (x: number) => x + 1;
      const multiplyByTwo = (x: number) => x * 2;
      const pipeline = pipe(addOne, multiplyByTwo);
      expect(pipeline(1)).toBe(4);

      // Typechecking.
      expectTypeOf(pipeline).toBeFunction();
      expectTypeOf(pipeline).parameter(0).toBeNumber();
      expectTypeOf(pipeline).returns.toBeNumber();
    });

    it('should create a three function pipeline', () => {
      const addOne = (x: number) => x + 1;
      const multiplyByTwo = (x: number) => x * 2;
      const subtractThree = (x: number) => x - 3;
      const pipeline = pipe(addOne, multiplyByTwo, subtractThree);
      expect(pipeline(1)).toBe(1);

      // Typechecking.
      expectTypeOf(pipeline).toBeFunction();
      expectTypeOf(pipeline).parameter(0).toBeNumber();
      expectTypeOf(pipeline).returns.toBeNumber();
    });

    it('should handle different types in pipeline', () => {
      const toString = (x: number) => x.toString();
      const toLength = (s: string) => s.length;
      const pipeline = pipe(toString, toLength);
      expect(pipeline(123)).toBe(3);

      // Typechecking.
      expectTypeOf(pipeline).toBeFunction();
      expectTypeOf(pipeline).parameter(0).toBeNumber();
      expectTypeOf(pipeline).returns.toBeNumber();
    });

    it('should allow different types of inputs and outputs', () => {
      const currentDate = (): Date => new Date();
      const toLocaleString = (date: Date) => date.toLocaleString();
      const pipeline = pipe(currentDate, toLocaleString);
      expect(pipeline()).toBe(new Date().toLocaleString());

      // Typechecking.
      expectTypeOf(pipeline).toBeFunction();
      expectTypeOf(pipeline).parameter(0).toBeVoid();
      expectTypeOf(pipeline).returns.toBeString();
    });

    it('should handle void values', () => {
      const identity = () => undefined;
      const pipeline = pipe(identity);
      expect(pipeline()).toBe(undefined);

      // Typechecking.
      expectTypeOf(pipeline).toBeFunction();
      expectTypeOf(pipeline).parameter(0).toBeVoid();
      expectTypeOf(pipeline).returns.toBeVoid();
    });

    it('should handle multiple values', () => {
      const add = (x: number, y: number) => x + y;
      const pipeline = pipe(add);
      expect(pipeline(1, 2)).toBe(3);

      // Typechecking.
      expectTypeOf(pipeline).toBeFunction();
      expectTypeOf(pipeline).parameter(0).toBeNumber();
      expectTypeOf(pipeline).parameter(1).toBeNumber();
      expectTypeOf(pipeline).returns.toBeNumber();
    });

    it('should handle identity pipeline', () => {
      const identity = (x: number) => x;
      const pipeline = pipe(identity);
      expect(pipeline(42)).toBe(42);

      // Typechecking.
      expectTypeOf(pipeline).toBeFunction();
      expectTypeOf(pipeline).parameter(0).toBeNumber();
      expectTypeOf(pipeline).returns.toBeNumber();
    });

    it('should handle null values', () => {
      const identity = (x: unknown) => x;
      const pipeline = pipe(identity);
      expect(pipeline(null)).toBe(null);

      // Typechecking.
      expectTypeOf(pipeline).toBeFunction();
      expectTypeOf(pipeline).parameter(0).toBeUnknown();
      expectTypeOf(pipeline).returns.toBeUnknown();
    });

    it('should handle undefined values', () => {
      const identity = (x: unknown) => x;
      const pipeline = pipe(identity);
      expect(pipeline(undefined)).toBe(undefined);

      // Typechecking.
      expectTypeOf(pipeline).toBeFunction();
      expectTypeOf(pipeline).parameter(0).toBeUnknown();
      expectTypeOf(pipeline).returns.toBeUnknown();
    });
  });

  describe('Result pipe', () => {
    it('should create a single function result pipe', () => {
      const isString = (value: string) =>
        typeof value === 'string' ? ok(value) : err('NOT_STRING');
      const pipeline = pipe('strict', isString);

      const r1 = pipeline('hello');
      const r2 = pipeline(123 as Any);

      expect(unwrap(r1)).toEqual('hello');
      expect(unwrap(r2)).toEqual('NOT_STRING');

      // Typechecking.
      expectTypeOf(pipeline).toBeFunction();
      expectTypeOf(pipeline).parameter(0).toBeString();
      expectTypeOf(pipeline).returns.toEqualTypeOf<Result<string, 'NOT_STRING'>>();
    });

    it('should create a two function result pipe', () => {
      const isString = (value: string) =>
        typeof value === 'string' ? ok(value) : err('NOT_STRING');
      const minLength = (length: number) => (value: string) =>
        value.length >= length ? ok(value) : err('TOO_SHORT');

      const pipeline = pipe('strict', isString, minLength(3));
      const r1 = pipeline('hello');
      const r2 = pipeline('hi');
      const r3 = pipeline(123 as Any);

      expect(unwrap(r1)).toEqual('hello');
      expect(unwrap(r2)).toEqual('TOO_SHORT');
      expect(unwrap(r3)).toEqual('NOT_STRING');

      // Typechecking.
      expectTypeOf(pipeline).toBeFunction();
      expectTypeOf(pipeline).parameter(0).toBeString();
      expectTypeOf(pipeline).returns.toEqualTypeOf<Result<string, 'NOT_STRING' | 'TOO_SHORT'>>();
      expectTypeOf(r1).toEqualTypeOf<Result<string, 'NOT_STRING' | 'TOO_SHORT'>>();
      expectTypeOf(r2).toEqualTypeOf<Result<string, 'NOT_STRING' | 'TOO_SHORT'>>();
      expectTypeOf(r3).toEqualTypeOf<Result<string, 'NOT_STRING' | 'TOO_SHORT'>>();
    });

    it('should create a three function result pipe', () => {
      const isString = (value: string) =>
        typeof value === 'string' ? ok(value) : err('NOT_STRING');
      const minLength = (length: number) => (value: string) =>
        value.length >= length ? ok(value) : err('TOO_SHORT');
      const hasUppercase = (value: string) =>
        /[A-Z]/.test(value) ? ok(value) : err('NO_UPPERCASE');

      const pipeline = pipe('strict', isString, minLength(3), hasUppercase);
      const r1 = pipeline('Hello');
      const r2 = pipeline('hello');
      const r3 = pipeline('hi');
      const r4 = pipeline(123 as Any);

      expect(unwrap(r1)).toEqual('Hello');
      expect(unwrap(r2)).toEqual('NO_UPPERCASE');
      expect(unwrap(r3)).toEqual('TOO_SHORT');
      expect(unwrap(r4)).toEqual('NOT_STRING');

      // Typechecking.
      expectTypeOf(pipeline).toBeFunction();
      expectTypeOf(pipeline).parameter(0).toBeString();
      expectTypeOf(pipeline).returns.toEqualTypeOf<
        Result<string, 'NOT_STRING' | 'TOO_SHORT' | 'NO_UPPERCASE'>
      >();
      expectTypeOf(r1).toEqualTypeOf<Result<string, 'NOT_STRING' | 'TOO_SHORT' | 'NO_UPPERCASE'>>();
      expectTypeOf(r2).toEqualTypeOf<Result<string, 'NOT_STRING' | 'TOO_SHORT' | 'NO_UPPERCASE'>>();
      expectTypeOf(r3).toEqualTypeOf<Result<string, 'NOT_STRING' | 'TOO_SHORT' | 'NO_UPPERCASE'>>();
      expectTypeOf(r4).toEqualTypeOf<Result<string, 'NOT_STRING' | 'TOO_SHORT' | 'NO_UPPERCASE'>>();
    });

    it('should handle different types in result pipeline', () => {
      const isNumber = (value: number) =>
        typeof value === 'number' ? ok(value) : err('NOT_NUMBER');
      const toString = (value: number) => ok(value.toString());
      const toLength = (value: string) => ok(value.length);

      const pipeline = pipe('strict', isNumber, toString, toLength);
      const r1 = pipeline(123);
      const r2 = pipeline('123' as Any);

      expect(unwrap(r1)).toEqual(3);
      expect(unwrap(r2)).toEqual('NOT_NUMBER');

      // Typechecking.
      expectTypeOf(pipeline).toBeFunction();
      expectTypeOf(pipeline).parameter(0).toBeNumber();
      expectTypeOf(pipeline).returns.toEqualTypeOf<Result<number, 'NOT_NUMBER'>>();
      expectTypeOf(r1).toEqualTypeOf<Result<number, 'NOT_NUMBER'>>();
      expectTypeOf(r2).toEqualTypeOf<Result<number, 'NOT_NUMBER'>>();
    });

    it('should allow different types of inputs and outputs in result pipeline', () => {
      const isString = (value: string) =>
        typeof value === 'string' ? ok(value) : err('NOT_STRING');
      const toUpperCase = (value: string) => ok(value.toUpperCase());
      const toLength = (value: string) => ok(value.length);

      const pipeline = pipe('strict', isString, toUpperCase, toLength);
      const r1 = pipeline('hello');
      const r2 = pipeline(123 as Any);

      expect(unwrap(r1)).toEqual(5);
      expect(unwrap(r2)).toEqual('NOT_STRING');

      // Typechecking.
      expectTypeOf(pipeline).toBeFunction();
      expectTypeOf(pipeline).parameter(0).toBeString();
      expectTypeOf(pipeline).returns.toEqualTypeOf<Result<number, 'NOT_STRING'>>();
      expectTypeOf(r1).toEqualTypeOf<Result<number, 'NOT_STRING'>>();
      expectTypeOf(r2).toEqualTypeOf<Result<number, 'NOT_STRING'>>();
    });

    it('should handle void values in result pipeline', () => {
      const getCurrentTime = () => ok(Date.now());
      const toString = (value: number) => ok(value.toString());

      const pipeline = pipe('strict', getCurrentTime, toString);
      const result = pipeline();
      expect(unwrap(result)).toBeTypeOf('string');

      // Typechecking.
      expectTypeOf(pipeline).toBeFunction();
      expectTypeOf(pipeline).parameter(0).toBeVoid();
      expectTypeOf(pipeline).returns.toEqualTypeOf<Result<string, never>>();
      expectTypeOf(result).toEqualTypeOf<Result<string, never>>();
    });

    it('should handle multiple values in result pipeline', () => {
      const add = (x: number, y: number) => ok(x + y);
      const multiplyByTwo = (value: number) => ok(value * 2);

      const pipeline = pipe('strict', add, multiplyByTwo);
      const result = pipeline(2, 3);
      expect(unwrap(result)).toEqual(10);

      // Typechecking.
      expectTypeOf(pipeline).toBeFunction();
      expectTypeOf(pipeline).parameter(0).toBeNumber();
      expectTypeOf(pipeline).parameter(1).toBeNumber();
      expectTypeOf(pipeline).returns.toEqualTypeOf<Result<number, never>>();
      expectTypeOf(result).toEqualTypeOf<Result<number, never>>();
    });

    describe('Modes', () => {
      it('should accumulate all errors in all mode', () => {
        const isString = (value: string) =>
          typeof value === 'string' ? ok(value) : err('NOT_STRING');
        const minLength = (length: number) => (value: string) =>
          value.length >= length ? ok(value) : err('TOO_SHORT');
        const hasUppercase = (value: string) =>
          /[A-Z]/.test(value) ? ok(value) : err('NO_UPPERCASE');

        const pipeline = pipe('all', isString, minLength(8), hasUppercase);
        const r1 = pipeline('weak');
        const r2 = pipeline('StrongP@ss123');
        const r3 = pipeline(123 as Any);

        expect(unwrap(r1)).toEqual(['TOO_SHORT', 'NO_UPPERCASE']);
        expect(unwrap(r2)).toEqual('StrongP@ss123');
        expect(unwrap(r3)).toEqual(['NOT_STRING', 'TOO_SHORT', 'NO_UPPERCASE']);

        // Typechecking.
        expectTypeOf(pipeline).toBeFunction();
        expectTypeOf(pipeline).parameter(0).toBeString();
        expectTypeOf(pipeline).returns.toEqualTypeOf<
          Result<string, ('NOT_STRING' | 'TOO_SHORT' | 'NO_UPPERCASE')[]>
        >();
        expectTypeOf(r1).toEqualTypeOf<
          Result<string, ('NOT_STRING' | 'TOO_SHORT' | 'NO_UPPERCASE')[]>
        >();
        expectTypeOf(r2).toEqualTypeOf<
          Result<string, ('NOT_STRING' | 'TOO_SHORT' | 'NO_UPPERCASE')[]>
        >();
        expectTypeOf(r3).toEqualTypeOf<
          Result<string, ('NOT_STRING' | 'TOO_SHORT' | 'NO_UPPERCASE')[]>
        >();
      });

      it('should stop at first error in strict mode', () => {
        const isString = (value: string) =>
          typeof value === 'string' ? ok(value) : err('NOT_STRING');
        const minLength = (length: number) => (value: string) =>
          value.length >= length ? ok(value) : err('TOO_SHORT');
        const hasUppercase = (value: string) =>
          /[A-Z]/.test(value) ? ok(value) : err('NO_UPPERCASE');

        const pipeline = pipe('strict', isString, minLength(8), hasUppercase);
        const r1 = pipeline('weak');
        const r2 = pipeline('StrongP@ss123');
        const r3 = pipeline(123 as Any);

        expect(unwrap(r1)).toEqual('TOO_SHORT');
        expect(unwrap(r2)).toEqual('StrongP@ss123');
        expect(unwrap(r3)).toEqual('NOT_STRING');

        // Typechecking.
        expectTypeOf(pipeline).toBeFunction();
        expectTypeOf(pipeline).parameter(0).toBeString();
        expectTypeOf(pipeline).returns.toEqualTypeOf<
          Result<string, 'NOT_STRING' | 'TOO_SHORT' | 'NO_UPPERCASE'>
        >();
        expectTypeOf(r1).toEqualTypeOf<
          Result<string, 'NOT_STRING' | 'TOO_SHORT' | 'NO_UPPERCASE'>
        >();
        expectTypeOf(r2).toEqualTypeOf<
          Result<string, 'NOT_STRING' | 'TOO_SHORT' | 'NO_UPPERCASE'>
        >();
        expectTypeOf(r3).toEqualTypeOf<
          Result<string, 'NOT_STRING' | 'TOO_SHORT' | 'NO_UPPERCASE'>
        >();
      });

      it('should handle mixed success and error cases in all mode', () => {
        const isString = (value: string) =>
          typeof value === 'string' ? ok(value) : err('NOT_STRING');
        const nonEmpty = (value: string) => (value.length > 0 ? ok(value) : err('EMPTY'));
        const hasNumber = (value: string) => (/\d/.test(value) ? ok(value) : err('NO_NUMBER'));

        const pipeline = pipe('all', isString, nonEmpty, hasNumber);
        const r1 = pipeline('hello');
        const r2 = pipeline('hello123');
        const r3 = pipeline('');
        const r4 = pipeline(123 as Any);

        expect(unwrap(r1)).toEqual(['NO_NUMBER']);
        expect(unwrap(r2)).toEqual('hello123');
        expect(unwrap(r3)).toEqual(['EMPTY', 'NO_NUMBER']);
        expect(unwrap(r4)).toEqual(['NOT_STRING', 'EMPTY']);

        // Typechecking.
        expectTypeOf(pipeline).toBeFunction();
        expectTypeOf(pipeline).parameter(0).toBeString();
        expectTypeOf(pipeline).returns.toEqualTypeOf<
          Result<string, ('NOT_STRING' | 'EMPTY' | 'NO_NUMBER')[]>
        >();
        expectTypeOf(r1).toEqualTypeOf<Result<string, ('NOT_STRING' | 'EMPTY' | 'NO_NUMBER')[]>>();
        expectTypeOf(r2).toEqualTypeOf<Result<string, ('NOT_STRING' | 'EMPTY' | 'NO_NUMBER')[]>>();
        expectTypeOf(r3).toEqualTypeOf<Result<string, ('NOT_STRING' | 'EMPTY' | 'NO_NUMBER')[]>>();
        expectTypeOf(r4).toEqualTypeOf<Result<string, ('NOT_STRING' | 'EMPTY' | 'NO_NUMBER')[]>>();
      });
    });
  });

  describe('Code examples', () => {
    it('should handle classic pipeline - simple function composition', () => {
      // Classic pipeline - simple function composition.
      const classicPipe = pipe(
        (x: number, y: number) => ({ x, y }),
        ({ x, y }) => x / y,
      );

      const r1 = classicPipe(10, 2); // 5
      const r2 = classicPipe(5, 0); // Infinity

      expect(r1).toBe(5);
      expect(r2).toBe(Infinity);

      // Typechecking.
      expectTypeOf(classicPipe).toBeFunction();
      expectTypeOf(classicPipe).parameter(0).toBeNumber();
      expectTypeOf(classicPipe).parameter(1).toBeNumber();
      expectTypeOf(classicPipe).returns.toBeNumber();
      expectTypeOf(r1).toBeNumber();
      expectTypeOf(r2).toBeNumber();
    });

    it('should handle result pipeline (strict mode) - stops at first error', () => {
      // Result pipeline (strict mode) - stops at first error.
      const resultPipeStrict = pipe(
        'strict',
        (x: number, y: number) => ok({ x, y }),
        ({ x, y }) => (y === 0 ? err('DIVISION_BY_ZERO') : ok(x / y)),
        (result) => (result < 0 ? err('NEGATIVE_RESULT') : ok(result)),
      );

      const rps1 = resultPipeStrict(10, 2); // ok(5)
      const rps2 = resultPipeStrict(5, 0); // err('DIVISION_BY_ZERO')
      const rps3 = resultPipeStrict(-1, 2); // err('NEGATIVE_RESULT')

      expect(unwrap(rps1)).toBe(5);
      expect(unwrap(rps2)).toBe('DIVISION_BY_ZERO');
      expect(unwrap(rps3)).toBe('NEGATIVE_RESULT');

      // Typechecking.
      expectTypeOf(resultPipeStrict).toBeFunction();
      expectTypeOf(resultPipeStrict).parameter(0).toBeNumber();
      expectTypeOf(resultPipeStrict).parameter(1).toBeNumber();
      expectTypeOf(resultPipeStrict).returns.toEqualTypeOf<
        Result<number, 'DIVISION_BY_ZERO' | 'NEGATIVE_RESULT'>
      >();
      expectTypeOf(rps1).toEqualTypeOf<Result<number, 'DIVISION_BY_ZERO' | 'NEGATIVE_RESULT'>>();
      expectTypeOf(rps2).toEqualTypeOf<Result<number, 'DIVISION_BY_ZERO' | 'NEGATIVE_RESULT'>>();
      expectTypeOf(rps3).toEqualTypeOf<Result<number, 'DIVISION_BY_ZERO' | 'NEGATIVE_RESULT'>>();
    });

    it('should handle result pipeline (all mode) - accumulates all errors', () => {
      // Result pipeline (all mode) - accumulates all errors.
      const resultPipeAll = pipe(
        'all',
        ({ name, age }: { name: string; age: number }) => ok({ name, age }),
        ({ name, age }) => (age < 0 ? err('INVALID_AGE') : ok({ name, age })),
        ({ name, age }) => (name === '' ? err('INVALID_NAME') : ok({ name, age })),
      );

      const rpa1 = resultPipeAll({ name: 'John', age: 30 }); // ok({ name: 'John', age: 30 })
      const rpa2 = resultPipeAll({ name: 'John', age: -5 }); // err(['INVALID_AGE'])
      const rpa3 = resultPipeAll({ name: '', age: 30 }); // err(['INVALID_NAME'])
      const rpa4 = resultPipeAll({ name: '', age: -1 }); // err(['INVALID_AGE', 'INVALID_NAME'])

      expect(unwrap(rpa1)).toEqual({ name: 'John', age: 30 });
      expect(unwrap(rpa2)).toEqual(['INVALID_AGE']);
      expect(unwrap(rpa3)).toEqual(['INVALID_NAME']);
      expect(unwrap(rpa4)).toEqual(['INVALID_AGE', 'INVALID_NAME']);

      // Typechecking.
      expectTypeOf(resultPipeAll).toBeFunction();
      expectTypeOf(resultPipeAll).parameter(0).toEqualTypeOf<{ name: string; age: number }>();
      expectTypeOf(resultPipeAll).returns.toEqualTypeOf<
        Result<{ name: string; age: number }, ('INVALID_AGE' | 'INVALID_NAME')[]>
      >();
      expectTypeOf(rpa1).toEqualTypeOf<
        Result<{ name: string; age: number }, ('INVALID_AGE' | 'INVALID_NAME')[]>
      >();
      expectTypeOf(rpa2).toEqualTypeOf<
        Result<{ name: string; age: number }, ('INVALID_AGE' | 'INVALID_NAME')[]>
      >();
      expectTypeOf(rpa3).toEqualTypeOf<
        Result<{ name: string; age: number }, ('INVALID_AGE' | 'INVALID_NAME')[]>
      >();
      expectTypeOf(rpa4).toEqualTypeOf<
        Result<{ name: string; age: number }, ('INVALID_AGE' | 'INVALID_NAME')[]>
      >();
    });

    it('should handle result pipeline (all mode) with multiple arguments - accumulates all errors', () => {
      // Result pipeline (all mode) with multiple arguments - accumulates all errors.
      const resultPipeAllWithArgs = pipe(
        'all',
        (name: string, age: number) => ok({ name, age }),
        ({ name, age }) => (age < 0 ? err('INVALID_AGE') : ok({ name, age })),
        ({ name, age }) => (name === '' ? err('INVALID_NAME') : ok({ name, age })),
      );

      const rpa5 = resultPipeAllWithArgs('John', 30); // ok({ name: 'John', age: 30 })
      const rpa6 = resultPipeAllWithArgs('John', -5); // err(['INVALID_AGE'])
      const rpa7 = resultPipeAllWithArgs('', 30); // err(['INVALID_NAME'])
      const rpa8 = resultPipeAllWithArgs('', -1); // err(['INVALID_AGE', 'INVALID_NAME'])

      expect(unwrap(rpa5)).toEqual({ name: 'John', age: 30 });
      expect(unwrap(rpa6)).toEqual(['INVALID_AGE']);
      expect(unwrap(rpa7)).toEqual(['INVALID_NAME']);
      expect(unwrap(rpa8)).toEqual(['INVALID_AGE', 'INVALID_NAME']);

      // Typechecking.
      expectTypeOf(resultPipeAllWithArgs).toBeFunction();
      expectTypeOf(resultPipeAllWithArgs).parameter(0).toBeString();
      expectTypeOf(resultPipeAllWithArgs).parameter(1).toBeNumber();
      expectTypeOf(resultPipeAllWithArgs).returns.toEqualTypeOf<
        Result<{ name: string; age: number }, ('INVALID_AGE' | 'INVALID_NAME')[]>
      >();
      expectTypeOf(rpa5).toEqualTypeOf<
        Result<{ name: string; age: number }, ('INVALID_AGE' | 'INVALID_NAME')[]>
      >();
      expectTypeOf(rpa6).toEqualTypeOf<
        Result<{ name: string; age: number }, ('INVALID_AGE' | 'INVALID_NAME')[]>
      >();
      expectTypeOf(rpa7).toEqualTypeOf<
        Result<{ name: string; age: number }, ('INVALID_AGE' | 'INVALID_NAME')[]>
      >();
      expectTypeOf(rpa8).toEqualTypeOf<
        Result<{ name: string; age: number }, ('INVALID_AGE' | 'INVALID_NAME')[]>
      >();
    });
  });
});
