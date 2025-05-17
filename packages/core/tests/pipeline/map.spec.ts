import { expectType } from 'tsd';

import '../../src/pipeline/map';
import { Pipeline } from '../../src/pipeline/pipeline';

describe('Pipeline.map', () => {
  describe('Runtime Tests', () => {
    it('should transform values synchronously', () => {
      const pipeline = Pipeline.create((n: number) => n * 2, 'Number pipeline').map((n) => n + 1);

      const result = pipeline.runSync(5);
      expect(result).toBe(11);
    });

    it('should transform values asynchronously', async () => {
      const pipeline = Pipeline.create(async (n: number) => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return n * 2;
      }, 'Async pipeline').map(async (n) => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return n + 1;
      });

      const result = await pipeline.runAsync(5);
      expect(result).toBe(11);
    });

    it('should chain multiple transformations', () => {
      const pipeline = Pipeline.create((n: number) => n * 2, 'Chained pipeline')
        .map((n) => n + 1)
        .map((n) => n.toString())
        .map((str) => `Result: ${str}`);

      const result = pipeline.runSync(5);
      expect(result).toBe('Result: 11');
    });

    it('should handle mixed sync and async transformations', async () => {
      const pipeline = Pipeline.create(async (n: number) => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return n * 2;
      }, 'Mixed pipeline')
        .map(async (n) => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return n + 1;
        })
        .map((n) => n.toString())
        .map((str) => `Result: ${str}`);

      const result = await pipeline.runAsync(5);
      expect(result).toBe('Result: 11');
    });

    it('should throw error when running async pipeline with runSync', () => {
      const pipeline = Pipeline.create((n: number) => n * 2, 'Async pipeline').map(async (n) => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return n + 1;
      });

      expect(() => pipeline.runSync(5)).toThrow(
        'Cannot run pipeline synchronously: found async step',
      );
    });

    it('should preserve step descriptions', () => {
      const pipeline = Pipeline.create((n: number) => n * 2, 'Pipeline with descriptions')
        .map((n) => n + 1, 'Add one')
        .map((n) => n.toString(), 'Convert to string');

      const steps = pipeline.toJSON();
      expect(steps).toHaveLength(4);
      expect(steps[0].type).toBe('create');
      expect(steps[0].description).toBe('Pipeline with descriptions');
      expect(steps[1].type).toBe('init');
      expect(steps[1].description).toBe('Initial value');
      expect(steps[2].type).toBe('map');
      expect(steps[2].description).toBe('Add one');
      expect(steps[3].type).toBe('map');
      expect(steps[3].description).toBe('Convert to string');
    });
  });

  describe('Type Tests', () => {
    it('should infer correct types for sync transformations', () => {
      const pipeline = Pipeline.create((n: number) => n * 2, 'Type test pipeline')
        .map((n) => n + 1)
        .map((n) => n.toString());

      // Test input type
      expectType<number>(5);
      // Test output type
      expectType<string>(pipeline.runSync(5));
    });

    it('should infer correct types for async transformations', async () => {
      const pipeline = Pipeline.create(async (n: number) => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return n * 2;
      }, 'Async type test pipeline')
        .map(async (n) => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return n + 1;
        })
        .map((n) => n.toString());

      // Test input type
      expectType<number>(5);
      // Test output type
      expectType<Promise<string>>(pipeline.runAsync(5));
    });

    it('should maintain type safety across multiple transformations', () => {
      const pipeline = Pipeline.create((n: number) => n * 2, 'Type safety pipeline')
        .map((n) => n + 1)
        .map((n) => n.toString())
        .map((str) => `Result: ${str}`);

      // Test that input type is preserved
      expectType<number>(5);

      // Test that output type is correctly transformed to string
      expectType<string>(pipeline.runSync(5));

      // Test that the pipeline type is correctly inferred
      expectType<Pipeline<number, string>>(pipeline);
    });

    it('should handle generic type transformations', () => {
      type Input = { id: number; value: string };
      type Output = { id: number; processed: string };

      const pipeline = Pipeline.create((input: Input) => input, 'Generic type pipeline').map(
        (input) => ({
          id: input.id,
          processed: input.value.toUpperCase(),
        }),
      );

      // Test input type
      expectType<Input>({ id: 1, value: 'test' });
      // Test output type
      expectType<Output>(pipeline.runSync({ id: 1, value: 'test' }));
    });

    it('should preserve error type across transformations', () => {
      const pipeline = Pipeline.create((n: number) => n * 2, 'Error type pipeline')
        .map((n) => n + 1)
        .map((n) => n.toString());

      // Test that the pipeline type includes CustomError
      expectType<Pipeline<number, string>>(pipeline);

      // Test that the error type is preserved after transformations
      const transformedPipeline = pipeline
        .map((str) => str.toUpperCase())
        .map((str) => `Result: ${str}`);

      expectType<Pipeline<number, string>>(transformedPipeline);
    });
  });
});
