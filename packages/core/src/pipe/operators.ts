/*
 * This file is part of the Daikit project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { Operator, StepFn } from './pipe';

/**
 * Creates a map operator that transforms each value using the provided function.
 *
 * @typeParam I - The type of the input value.
 * @typeParam O - The type of the output value.
 * @param fn - The function to transform each value.
 * @param description - Optional description for this operator.
 * @returns A map operator that can be used in a pipeline.
 *
 * @example
 * ```ts
 * const pipeline = d.pipe('String pipeline', [
 *   d.map((n: number) => n.toString(), 'Convert to string')
 * ]);
 * ```
 *
 * @public
 */
export function map<I, O>(fn: StepFn<I, O>, description = 'Map transformation'): Operator<I, O> {
  return {
    type: 'map',
    description,
    fn,
  };
}

/**
 * Creates a from operator that initializes the pipeline with a value or function.
 *
 * @typeParam I - The type of the input value.
 * @typeParam O - The type of the output value.
 * @param fn - The function to initialize the pipeline.
 * @param description - Optional description for this operator.
 * @returns A from operator that can be used in a pipeline.
 *
 * @example
 * ```ts
 * const pipeline = d.pipe('Number pipeline', [
 *   d.from((n: number) => n * 2, 'Double the number')
 * ]);
 * ```
 *
 * @public
 */
export function from<I, O>(fn: StepFn<I, O>, description = 'Initial value'): Operator<I, O> {
  return {
    type: 'from',
    description,
    fn,
  };
}

/**
 * Creates a tap operator that allows side effects without changing the value.
 *
 * @typeParam T - The type of the value.
 * @param fn - The function to execute as a side effect.
 * @param description - Optional description for this operator.
 * @returns A tap operator that can be used in a pipeline.
 *
 * @example
 * ```ts
 * const pipeline = d.pipe('Number pipeline', [
 *   d.tap((n: number) => console.log('Current value:', n), 'Log value')
 * ]);
 * ```
 *
 * @public
 */
export function tap<T>(
  fn: (value: T) => void | Promise<void>,
  description = 'Tap operation',
): Operator<T, T> {
  return {
    type: 'tap',
    description,
    fn: async (value: T) => {
      await fn(value);
      return value;
    },
  };
}

/**
 * Creates a bind operator that merges the result with the previous value.
 *
 * @typeParam I - The type of the input value.
 * @typeParam O - The type of the output value.
 * @param key - The key to identify this bind operation.
 * @param fn - The function that returns a new value to be merged.
 * @param description - Optional description for this operator.
 * @returns A bind operator that can be used in a pipeline.
 *
 * @example
 * ```ts
 * const pipeline = d.pipe('Number pipeline', [
 *   d.bind('multiplier', (n: number) => ({
 *     factor: 2,
 *     result: n * 2
 *   }), 'Double with factor')
 * ]);
 * ```
 *
 * @public
 */
export function bind<I, O>(
  key: string,
  fn: (value: I) => O,
  description = 'Bind operation',
): Operator<I, O & I> {
  return {
    type: 'bind',
    description,
    fn: (value: I) =>
      ({
        ...value,
        // The binded value is merged with the previous value.
        [key]: fn(value),
      }) as O & I,
  };
}
