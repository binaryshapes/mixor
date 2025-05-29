import { describe, expect, it } from 'vitest';

import { parallel } from '../../src/pipe/helpers';
import { all } from '../../src/pipe/helpers';
import { flow } from '../../src/pipe/helpers';
import { pipe } from '../../src/pipe/pipe';

describe('Pipe helpers', () => {
  // *********************************************************************************************
  // Parallel pipe helper.
  // *********************************************************************************************

  describe('parallel', () => {
    it('should run multiple pipelines in parallel with different inputs', () => {
      const double = pipe<number>('Double').step('Double', (n) => n * 2);
      const square = pipe<number>('Square').step('Square', (n) => n * n);
      const stringify = pipe<number>('Stringify').step('Stringify', (n) => n.toString());

      const parallelPipe = parallel(double, square, stringify).build();
      const result = parallelPipe([5, 10, 200]);

      expect(result).toEqual([10, 100, '200']);
    });

    it('should handle async pipelines', async () => {
      const asyncDouble = pipe<number>('AsyncDouble').step('AsyncDouble', async (n) => n * 2);
      const asyncSquare = pipe<number>('AsyncSquare').step('AsyncSquare', async (n) => n * n);
      const asyncStringify = pipe<number>('AsyncStringify').step('AsyncStringify', async (n) =>
        n.toString(),
      );

      const parallelPipe = parallel(asyncDouble, asyncSquare, asyncStringify).build();
      const result = await parallelPipe([5, 10, 200]);

      expect(result).toEqual([10, 100, '200']);
    });

    it('should handle mixed sync and async pipelines', async () => {
      const syncDouble = pipe<number>('SyncDouble').step('SyncDouble', (n) => n * 2);
      const asyncSquare = pipe<number>('AsyncSquare').step('AsyncSquare', async (n) => n * n);
      const syncStringify = pipe<number>('SyncStringify').step('SyncStringify', (n) =>
        n.toString(),
      );

      const parallelPipe = parallel(syncDouble, asyncSquare, syncStringify).build();
      const result = await parallelPipe([5, 10, 200]);

      expect(result).toEqual([10, 100, '200']);
    });

    it('should handle different input and output types', () => {
      const numberToDouble = pipe<number>('NumberToDouble').step('NumberToDouble', (n) => n * 2);
      const stringToLength = pipe<string>('StringToLength').step('StringToLength', (s) => s.length);
      const booleanToNumber = pipe<boolean>('BooleanToNumber').step('BooleanToNumber', (b) =>
        b ? 1 : 0,
      );

      const parallelPipe = parallel(numberToDouble, stringToLength, booleanToNumber).build();
      const result = parallelPipe([5, 'hello', true]);

      expect(result).toEqual([10, 5, 1]);
    });

    it('should handle empty pipeline array', () => {
      const parallelPipe = parallel().build();
      const result = parallelPipe([]);
      expect(result).toEqual([]);
    });

    it('should preserve the order of results', async () => {
      const slowPipe = pipe<number>('Slow').step('Slow', async (n) => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return n * 2;
      });
      const fastPipe = pipe<number>('Fast').step('Fast', (n) => n * 2);

      const parallelPipe = parallel(slowPipe, fastPipe).build();
      const result = await parallelPipe([5, 10]);

      expect(result).toEqual([10, 20]);
    });
  });

  // *********************************************************************************************
  // All pipe helper.
  // *********************************************************************************************

  describe('all', () => {
    it('should run multiple pipelines in parallel with the same input', () => {
      const double = pipe<number>('Double').step('Double', (n) => n * 2);
      const square = pipe<number>('Square').step('Square', (n) => n * n);
      const stringify = pipe<number>('Stringify').step('Stringify', (n) => n.toString());

      const allPipe = all(double, square, stringify).build();
      const result = allPipe(5);

      expect(result).toEqual([10, 25, '5']);
    });

    it('should handle async pipelines', async () => {
      const asyncDouble = pipe<number>('AsyncDouble').step('AsyncDouble', async (n) => n * 2);
      const asyncSquare = pipe<number>('AsyncSquare').step('AsyncSquare', async (n) => n * n);
      const asyncStringify = pipe<number>('AsyncStringify').step('AsyncStringify', async (n) =>
        n.toString(),
      );

      const allPipe = all(asyncDouble, asyncSquare, asyncStringify).build();
      const result = await allPipe(5);

      expect(result).toEqual([10, 25, '5']);
    });

    it('should handle mixed sync and async pipelines', async () => {
      const syncDouble = pipe<number>('SyncDouble').step('SyncDouble', (n) => n * 2);
      const asyncSquare = pipe<number>('AsyncSquare').step('AsyncSquare', async (n) => n * n);
      const syncStringify = pipe<number>('SyncStringify').step('SyncStringify', (n) =>
        n.toString(),
      );

      const allPipe = all(syncDouble, asyncSquare, syncStringify).build();
      const result = await allPipe(5);

      expect(result).toEqual([10, 25, '5']);
    });

    it('should handle different output types', () => {
      const numberToDouble = pipe<number>('NumberToDouble').step('NumberToDouble', (n) => n * 2);
      const numberToString = pipe<number>('NumberToString').step('NumberToString', (n) =>
        n.toString(),
      );
      const numberToBoolean = pipe<number>('NumberToBoolean').step('NumberToBoolean', (n) => n > 0);

      const allPipe = all(numberToDouble, numberToString, numberToBoolean).build();
      const result = allPipe(5);

      expect(result).toEqual([10, '5', true]);
    });

    it('should handle empty pipeline array', () => {
      const allPipe = all().build();
      const result = allPipe([]);

      expect(result).toEqual([]);
    });

    it('should preserve the order of results', async () => {
      const slowPipe = pipe<number>('Slow').step('Slow', async (n) => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return n * 2;
      });
      const fastPipe = pipe<number>('Fast').step('Fast', (n) => n * 2);

      const allPipe = all(slowPipe, fastPipe).build();
      const result = await allPipe(5);

      expect(result).toEqual([10, 10]);
    });
  });

  // *********************************************************************************************
  // Flow pipe helper.
  // *********************************************************************************************

  describe('flow', () => {
    it('should run pipelines in sequence (sync)', () => {
      const double = pipe<number>('Double').step('Double', (n) => n * 2);
      const square = pipe<number>('Square').step('Square', (n) => n * n);
      const flowPipe = flow(double, square).build();
      const result = flowPipe(3);
      // (3 * 2) = 6, (6 * 6) = 36
      expect(result).toBe(36);
    });

    it('should run pipelines in sequence (async)', async () => {
      const double = pipe<number>('Double').step('Double', async (n) => n * 2);
      const square = pipe<number>('Square').step('Square', async (n) => n * n);
      const flowPipe = flow(double, square).build();
      const result = await flowPipe(3);
      expect(result).toBe(36);
    });

    it('should run pipelines in sequence (mixed sync/async)', async () => {
      const double = pipe<number>('Double').step('Double', (n) => n * 2);
      const square = pipe<number>('Square').step('Square', async (n) => n * n);
      const flowPipe = flow(double, square).build();
      const result = await flowPipe(4);
      // (4 * 2) = 8, (8 * 8) = 64
      expect(result).toBe(64);
    });

    it('should return the input if no pipelines are provided', () => {
      const flowPipe = flow().build();
      const result = flowPipe([]);
      expect(result).toEqual([]);
    });

    it('should pass output of each pipeline as input to the next', () => {
      const toString = pipe<number>('ToString').step('ToString', (n) => n.toString());
      const appendExclamation = pipe<string>('AppendExclamation').step(
        'AppendExclamation',
        (s) => s + '!',
      );
      const flowPipe = flow(toString, appendExclamation).build();
      // FIXME: This is a valid and work, but the type inference is not working as expected.
      const result = (flowPipe as any)(42);
      expect(result).toBe('42!');
    });

    it('should support compatible type changes between steps', () => {
      const toBool = pipe<number>('ToBool').step('ToBool', (n) => n > 0);
      const boolToString = pipe<boolean>('BoolToString').step('BoolToString', (b) =>
        b ? 'yes' : 'no',
      );
      const flowPipe = flow(toBool, boolToString).build();
      // FIXME: This is a valid and work, but the type inference is not working as expected.
      const result = (flowPipe as any)(1);
      expect(result).toBe('yes');
    });
  });
});
