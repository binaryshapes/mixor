import { describe, expect, it } from 'vitest';

import { pipe } from '../../src/pipe';

describe('Pipe', () => {
  describe('Normal functions', () => {
    it('should create a pipe with a name', () => {
      const pipeline = pipe<number>('test-pipe');
      const steps = pipeline.steps();

      expect(steps.name).toBe('test-pipe');
      expect(steps.steps).toHaveLength(0);
    });

    it('should execute a single step correctly', () => {
      const pipeline = pipe<number>('single-step')
        .step('double', (n) => n * 2)
        .build();

      expect(pipeline(5)).toBe(10);
    });

    it('should execute multiple steps in sequence', () => {
      const pipeline = pipe<number>('multiple-steps')
        .step('double', (n) => n * 2)
        .step('add', (n) => n + 1)
        .step('square', (n) => n * n)
        .build();

      expect(pipeline(3)).toBe(49); // (3 * 2 + 1)² = 49
    });

    it('should handle object transformations', () => {
      type User = { name: string; age: number };

      const pipeline = pipe<User>('object-transform')
        .step('add id', (user) => ({ ...user, id: `${user.name}-${user.age}` }))
        .step('add status', (user) => ({ ...user, status: user.age >= 18 ? 'adult' : 'minor' }))
        .build();

      const result = pipeline({ name: 'John', age: 20 });
      expect(result).toEqual({
        name: 'John',
        age: 20,
        id: 'John-20',
        status: 'adult',
      });
    });

    it('should handle async operations', async () => {
      const pipeline = pipe<number>('async-pipe')
        .step('double', async (n) => n * 2)
        .step('add', (n) => n + 1)
        .build();

      const result = await pipeline(5);
      expect(result).toBe(11);
    });

    it('should handle nested async operations', async () => {
      const pipeline = pipe<{ value: number }>('nested-async')
        .step('process', async (obj) => ({
          value: await Promise.resolve(obj.value * 2),
        }))
        .step('finalize', (obj) => ({
          value: obj.value + 1,
          processed: true,
        }))
        .build();

      const result = await pipeline({ value: 5 });
      expect(result).toEqual({
        value: 11,
        processed: true,
      });
    });

    it('should track steps metadata correctly', () => {
      const pipeline = pipe<number>('metadata-test')
        .step('double', (n) => n * 2)
        .step('add', (n) => n + 1);

      const steps = pipeline.steps();
      expect(steps.name).toBe('metadata-test');
      expect(steps.steps).toHaveLength(2);
      expect(steps.steps[0].description).toBe('double');
      expect(steps.steps[1].description).toBe('add');
    });

    it('should handle type transformations correctly', () => {
      const pipeline = pipe<string>('type-transform')
        .step('parse', (str) => parseInt(str, 10))
        .step('multiply', (num) => num * 2)
        .build();

      expect(pipeline('42')).toBe(84);
    });

    it('should handle array transformations', () => {
      const pipeline = pipe<number[]>('array-transform')
        .step('map', (arr) => arr.map((n) => n * 2))
        .step('filter', (arr) => arr.filter((n) => n > 5))
        .build();

      expect(pipeline([1, 2, 3, 4, 5])).toEqual([6, 8, 10]);
    });
  });
});
