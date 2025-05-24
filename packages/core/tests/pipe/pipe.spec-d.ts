import { describe, expectTypeOf, it } from 'vitest';

import { pipe } from '../../src/pipe/pipe';

describe('Pipe Type', () => {
  describe('Basic Pipe Type Inference', () => {
    it('should infer correct types for sync pipeline', () => {
      const pipeline = pipe<number>('number-pipeline')
        .step('double', (n) => n * 2)
        .step('add', (n) => n + 1)
        .build();

      type ExpectedType = (value: number) => number;
      expectTypeOf(pipeline).toEqualTypeOf<ExpectedType>();
    });

    it('should infer correct types for async pipeline', () => {
      const pipeline = pipe<number>('async-number-pipeline')
        .step('double', (n) => n * 2)
        .step('async-add', async (n) => n + 1)
        .build();

      type ExpectedType = (value: number) => Promise<number>;
      expectTypeOf(pipeline).toEqualTypeOf<ExpectedType>();
    });
  });

  describe('Complex Type Transformations', () => {
    it('should handle object transformations', () => {
      type User = { name: string; age: number };
      type UserWithRole = { name: string; age: number; role: string };

      const pipeline = pipe<User>('user-pipeline')
        .step('add-role', (user) => ({ ...user, role: 'admin' }))
        .build();

      type ExpectedType = (value: User) => UserWithRole;
      expectTypeOf(pipeline).toEqualTypeOf<ExpectedType>();
    });

    it('should handle mixed sync/async transformations', () => {
      type Input = { id: number };
      type Output = { id: number; data: string };

      const pipeline = pipe<Input>('mixed-pipeline')
        .step('sync-transform', (input) => ({ ...input, temp: 'temp' }))
        .step('async-transform', async (input) => ({ id: input.id, data: 'async-data' }))
        .build();

      type ExpectedType = (value: Input) => Promise<Output>;
      expectTypeOf(pipeline).toEqualTypeOf<ExpectedType>();
    });
  });

  describe('Deep Type Inference', () => {
    it('should handle nested promises', () => {
      type Input = { value: number };
      type Output = { result: number };

      const pipeline = pipe<Input>('nested-promise-pipeline')
        .step('process', async (input) => ({
          result: await Promise.resolve(input.value * 2),
        }))
        .build();

      type ExpectedType = (value: Input) => Promise<Output>;
      expectTypeOf(pipeline).toEqualTypeOf<ExpectedType>();
    });

    it('should handle array transformations', () => {
      const pipeline = pipe<number[]>('array-pipeline')
        .step('map', (arr) => arr.map((n) => n * 2))
        .step('async-filter', async (arr) => arr.filter((n) => n > 5))
        .build();

      type ExpectedType = (value: number[]) => Promise<number[]>;
      expectTypeOf(pipeline).toEqualTypeOf<ExpectedType>();
    });
  });

  describe('Pipe Builder Type Tests', () => {
    it('should maintain type safety through multiple steps', () => {
      const pipeline = pipe<string>('multi-step-pipeline')
        .step('parse', (str) => parseInt(str, 10))
        .step('validate', (num) => num > 0)
        .step('format', (bool) => (bool ? 'valid' : 'invalid'))
        .build();

      type ExpectedType = (value: string) => 'valid' | 'invalid';
      expectTypeOf(pipeline).toEqualTypeOf<ExpectedType>();
    });

    it('should handle type narrowing', () => {
      type Input = string | number;
      type Output = number;

      const pipeline = pipe<Input>('type-narrowing-pipeline')
        .step('convert', (input) => (typeof input === 'string' ? parseInt(input, 10) : input))
        .build();

      type ExpectedType = (value: Input) => Output;
      expectTypeOf(pipeline).toEqualTypeOf<ExpectedType>();
    });
  });
});
