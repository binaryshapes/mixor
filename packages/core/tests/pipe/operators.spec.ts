import { describe, expect, expectTypeOf, it, suite, vi } from 'vitest';

import { bind, ifThen, ifThenElse, map, pipe, tap } from '../../src/pipe';
import type { PipeValue } from '../../src/pipe';

describe('Pipe Operators', () => {
  // *********************************************************************************************
  // Map Operator.
  // *********************************************************************************************

  describe('Map Operator', () => {
    describe('Isolated Context', () => {
      it('should transform a value using the provided function', () => {
        const double = map((n: number) => n * 2);
        const result = double(5);
        expect(result.value).toBe(10);
      });

      it('should handle different types of transformations', () => {
        const toString = map((n: number) => n.toString());
        const result = toString(42);
        expect(result.value).toBe('42');
      });

      it('should work with async functions', async () => {
        const asyncDouble = map(async (n: number) => n * 2);
        const result = asyncDouble(5);
        expect(result.value).toBeInstanceOf(Promise);
        const resultValue = await result.value;
        expect(resultValue).toBe(10);
      });
    });

    describe('Pipeline Context', () => {
      it('should work within a pipeline', () => {
        const pipeline = pipe<number>('test')
          .step(
            'double',
            map((n) => n * 2),
          )
          .build();

        expect(pipeline(5)).toBe(10);
      });

      it('should chain multiple map operations', () => {
        const pipeline = pipe<number>('test')
          .step(
            'double',
            map((n) => n * 2),
          )
          .step(
            'add-one',
            map((n) => n + 1),
          )
          .build();

        expect(pipeline(5)).toBe(11);
      });
    });
  });

  // *********************************************************************************************
  // Bind Operator.
  // *********************************************************************************************

  describe('Bind', () => {
    describe('Isolated Context', () => {
      it('should add a new property to an object', () => {
        const addAge = bind('age', () => 25);
        const result = addAge({ name: 'John' });
        expect(result.value).toEqual({ name: 'John', age: 25 });
      });

      it('should handle async bindings', async () => {
        const addAge = bind('age', async () => 25);
        const result = addAge({ name: 'John' });
        expect(result.value.age).toBeInstanceOf(Promise);
        const age = await result.value.age;
        expect(age).toBe(25);
      });

      it('should preserve existing properties', () => {
        const addAge = bind('age', () => 25);
        const result = addAge({ name: 'John', id: 1 });
        expect(result.value).toEqual({ name: 'John', id: 1, age: 25 });
      });

      it('should work with primitive values', () => {
        const addAge = bind('age', () => 25);
        const result = addAge(5);
        expect(result.value).toEqual({ age: 25 });
      });

      it('should use the received value as the argument for the function', () => {
        const addAge = bind(
          'age',
          (user: { name: string; birthdate: Date }) =>
            new Date('2024-05-01').getFullYear() - user.birthdate.getFullYear(),
        );
        const result = addAge({ name: 'John', birthdate: new Date('1990-01-01') });
        expect(result.value).toEqual({ name: 'John', birthdate: new Date('1990-01-01'), age: 35 });
      });
    });

    describe('Pipeline Context', () => {
      it('should work within a pipeline', () => {
        const pipeline = pipe<{ name: string }>('test')
          .step(
            'add-age',
            bind('age', () => 25),
          )
          .step(
            'add-id',
            bind('id', () => 1),
          )
          .build();

        const result = pipeline({ name: 'John' });
        expect(result).toEqual({ name: 'John', age: 25, id: 1 });
      });

      it('should chain with other operators', () => {
        const pipeline = pipe<{ name: string }>('test')
          .step(
            'add-age',
            bind('age', () => 25),
          )
          .step(
            'double-age',
            map((user) => ({ ...user, age: user.age * 2 })),
          )
          .build();

        const result = pipeline({ name: 'John' });
        expect(result).toEqual({ name: 'John', age: 50 });
      });
    });
  });

  // *********************************************************************************************
  // Tap Operator.
  // *********************************************************************************************

  describe('Tap', () => {
    describe('Isolated Context', () => {
      it('should execute side effect without modifying the value', () => {
        let sideEffect = 0;
        const increment = tap(() => sideEffect++);
        const result = increment(5);
        expect(result.value).toBe(5);
        expect(sideEffect).toBe(1);
      });

      it('should work with async side effects', async () => {
        vi.useFakeTimers();
        let sideEffect = 0;
        const asyncIncrement = tap(async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          sideEffect++;
        });

        const result = asyncIncrement(5);
        expect(result.value).toBe(5);
        expect(sideEffect).toBe(0); // Side effect hasn't happened yet

        // Fast-forward time by 100ms
        await vi.advanceTimersByTimeAsync(100);

        expect(sideEffect).toBe(1); // Now the side effect should have happened

        vi.useRealTimers();
      });

      it('should pass the correct value to the side effect', () => {
        let capturedValue: number | undefined;
        const capture = tap((value: number) => {
          capturedValue = value;
        });
        capture(42);
        expect(capturedValue).toBe(42);
      });
    });

    describe('Pipeline Context', () => {
      it('should work within a pipeline', () => {
        let sideEffect = 0;
        const pipeline = pipe<number>('test')
          .step(
            'increment',
            tap(() => sideEffect++),
          )
          .step(
            'double',
            map((n) => n * 2),
          )
          .build();

        const result = pipeline(5);
        expect(result).toBe(10);
        expect(sideEffect).toBe(1);
      });

      it('should allow multiple side effects', () => {
        let effect1 = 0;
        let effect2 = 0;
        const pipeline = pipe<number>('test')
          .step(
            'effect1',
            tap(() => effect1++),
          )
          .step(
            'double',
            map((n) => n * 2),
          )
          .step(
            'effect2',
            tap(() => effect2++),
          )
          .build();

        const result = pipeline(5);
        expect(result).toBe(10);
        expect(effect1).toBe(1);
        expect(effect2).toBe(1);
      });
    });
  });

  // *********************************************************************************************
  // IfThen Operator.
  // *********************************************************************************************

  suite('IfThen', () => {
    it('should execute the then function when condition is true', () => {
      const doubleIfPositive = ifThen((n: number) => ({
        if: n > 0,
        then: n * 2,
      }));
      const result = doubleIfPositive(5);
      expect(result.value).toBe(10);

      // Generic Typechecking.
      expectTypeOf(doubleIfPositive).toBeFunction();
      expectTypeOf(doubleIfPositive).parameter(0).toBeNumber();
      expectTypeOf(doubleIfPositive).returns.toMatchObjectType<
        PipeValue<number | undefined, 'ifThen'>
      >();

      // Values Typechecking.
      expectTypeOf(result).toEqualTypeOf<PipeValue<number | undefined, 'ifThen'>>();
      expectTypeOf(result.value).toEqualTypeOf<number | undefined>();
    });

    it('should return undefined when condition is false', () => {
      const doubleIfPositive = ifThen((n: number) => ({
        if: n > 0,
        then: n * 2,
      }));
      const result = doubleIfPositive(-5);
      expect(result.value).toBeUndefined();

      // Generic Typechecking.
      expectTypeOf(doubleIfPositive).toBeFunction();
      expectTypeOf(doubleIfPositive).parameter(0).toBeNumber();
      expectTypeOf(doubleIfPositive).returns.toMatchObjectType<
        PipeValue<number | undefined, 'ifThen'>
      >();

      // Values Typechecking.
      expectTypeOf(result).toEqualTypeOf<PipeValue<number | undefined, 'ifThen'>>();
      expectTypeOf(result.value).toEqualTypeOf<number | undefined>();
    });

    it('should handle complex conditions and transformations', () => {
      type User = {
        isAdult: boolean;
        age: number;
        name: string;
      };

      const processUser = ifThen((user: { age: number; name: string }) => ({
        if: user.age >= 18,
        then: { ...user, isAdult: true },
      }));
      const result = processUser({ name: 'John', age: 20 });
      expect(result.value).toEqual({ name: 'John', age: 20, isAdult: true });

      // Generic Typechecking.
      expectTypeOf(processUser).toBeFunction();
      expectTypeOf(processUser).parameter(0).toEqualTypeOf<{ age: number; name: string }>();
      expectTypeOf(processUser).returns.toEqualTypeOf<PipeValue<User | undefined, 'ifThen'>>();

      // Values Typechecking.
      expectTypeOf(result).toEqualTypeOf<PipeValue<User | undefined, 'ifThen'>>();
      expectTypeOf(result.value).toEqualTypeOf<User | undefined>();
    });

    it('should work within a pipeline', () => {
      const pipeline = pipe<number>('test')
        .step(
          'double-if-positive',
          ifThen((n) => ({
            if: n > 0,
            then: n * 2,
          })),
        )
        .build();

      const resultTrue = pipeline(5);
      const resultFalse = pipeline(-5);
      expect(resultTrue).toBe(10);
      expect(resultFalse).toBeUndefined();

      // Generic Typechecking.
      expectTypeOf(pipeline).toBeFunction();
      expectTypeOf(pipeline).parameter(0).toBeNumber();
      expectTypeOf(pipeline).returns.toEqualTypeOf<number | undefined>();

      // Values Typechecking.
      expectTypeOf(resultTrue).toEqualTypeOf<number | undefined>();
      expectTypeOf(resultFalse).toEqualTypeOf<number | undefined>();
    });
  });

  // *********************************************************************************************
  // IfThenElse Operator.
  // *********************************************************************************************

  describe('IfThenElse', () => {
    it('should execute the then function when condition is true', () => {
      const safeDivide = ifThenElse((a: [number, number]) => ({
        if: a[1] !== 0,
        then: a[0] / a[1],
        else: 0,
      }));
      const result = safeDivide([10, 2]);
      expect(result.value).toBe(5);

      // Generic Typechecking.
      expectTypeOf(safeDivide).toBeFunction();
      expectTypeOf(safeDivide).parameter(0).toEqualTypeOf<[number, number]>();
      expectTypeOf(safeDivide).returns.toEqualTypeOf<PipeValue<number, 'ifThenElse'>>();

      // Values Typechecking.
      expectTypeOf(result).toEqualTypeOf<PipeValue<number, 'ifThenElse'>>();
      expectTypeOf(result.value).toEqualTypeOf<number>();
    });

    it('should execute the else function when condition is false', () => {
      const safeDivide = ifThenElse((a: [number, number]) => ({
        if: a[1] !== 0,
        then: a[0] / a[1],
        else: false,
      }));
      const result = safeDivide([10, 0]);
      expect(result.value).toBe(false);

      // Generic Typechecking.
      expectTypeOf(safeDivide).toBeFunction();
      expectTypeOf(safeDivide).parameter(0).toEqualTypeOf<[number, number]>();
      expectTypeOf(safeDivide).returns.toEqualTypeOf<PipeValue<boolean | number, 'ifThenElse'>>();

      // Values Typechecking.
      expectTypeOf(result).toEqualTypeOf<PipeValue<boolean | number, 'ifThenElse'>>();
      expectTypeOf(result.value).toEqualTypeOf<boolean | number>();
    });

    it('should handle complex conditions and transformations', () => {
      type User = {
        name: string;
        age: number;
        status: string;
      };

      const processUser = ifThenElse((user: { age: number; name: string }) => ({
        if: user.age >= 18,
        then: { ...user, status: 'adult' },
        else: { ...user, status: 'minor' },
      }));
      const adultResult = processUser({ name: 'John', age: 20 });
      const minorResult = processUser({ name: 'Jane', age: 15 });

      expect(adultResult.value).toEqual({ name: 'John', age: 20, status: 'adult' });
      expect(minorResult.value).toEqual({ name: 'Jane', age: 15, status: 'minor' });

      // Generic Typechecking.
      expectTypeOf(processUser).toBeFunction();
      expectTypeOf(processUser).parameter(0).toEqualTypeOf<{ age: number; name: string }>();
      expectTypeOf(processUser).returns.toEqualTypeOf<PipeValue<User, 'ifThenElse'>>();

      // Values Typechecking.
      expectTypeOf(adultResult).toEqualTypeOf<PipeValue<User, 'ifThenElse'>>();
      expectTypeOf(adultResult.value).toEqualTypeOf<User>();
    });

    it('should work within a pipeline', () => {
      const pipeline = pipe<[number, number]>('test')
        .step(
          'safe-divide',
          ifThenElse((a: [number, number]) => ({
            if: a[1] !== 0,
            then: a[0] / a[1],
            else: NaN,
          })),
        )
        .build();

      expect(pipeline([10, 2])).toBe(5);
      expect(pipeline([10, 0])).toBe(NaN);
    });
  });
});
