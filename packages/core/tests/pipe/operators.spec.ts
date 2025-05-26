import { describe, expect, it, vi } from 'vitest';

import { bind, map, pipe, tap } from '../../src/pipe';

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
});
