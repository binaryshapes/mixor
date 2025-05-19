/*
 * This file is part of the Daikit project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { Any, Prettify } from '../types';

/**
 * A pipe function is a function that can be applied to a value.
 *
 * @typeParam A - The type of the input value.
 * @typeParam B - The type of the output value.
 *
 * @public
 */
type PipeFn<A, B> = (a: A) => B;

/**
 * A pipe step is a object that contains a key and a function that can be applied to a value.
 * Potentially used to trace and debug the pipeline.
 *
 * @typeParam A - The type of the input value.
 * @typeParam B - The type of the output value.
 *
 * @internal
 */
type PipeStep<A, B> = {
  key: string;
  fn: PipeFn<A, B>;
};

/**
 * The Pipe type represents a pipeline of functions that can be applied to a value.
 *
 * @typeParam A - The type of the input value.
 * @typeParam B - The type of the output value.
 *
 * @public
 */
type Pipe<A, B = A> = {
  step: <C>(key: string, fn: PipeFn<B, C>) => Pipe<A, C>;
  build: () => (value: A) => Prettify<B>;
  describe: () => string;
  steps: () => PipeStep<A, B>[];
};

/**
 * Creates a new Pipe Builder
 *
 * @typeParam A - The type of the input value.
 * @returns A new Pipe Builder
 *
 * @example
 * ```ts
 * const pipeline = pipe<User>()
 *   .step('map', bind('ageRange', (u) => (u.age >= 18 ? 'adult' : 'minor')))
 *   .step('bind', bind('password', () => 'securePassword'))
 *   .step('tap', tap((u) => console.log('The tap:', u)))
 *   .step('map', map((user) => user.ageRange))
 *   .build();
 * ```
 *
 * @public
 */
function pipe<A>(): Pipe<A> {
  const steps: PipeStep<Any, Any>[] = [];

  const pipeline = {
    step: <C>(key: string, fn: PipeFn<A, C>) => {
      steps.push({ key, fn });
      return {
        step: <D>(nextKey: string, nextFn: PipeFn<C, D>) => {
          console.log('Step', nextKey, nextFn instanceof Promise);
          return pipeline.step(nextKey, nextFn as Any);
        },
        build: () => (a: A) => steps.reduce((acc, step) => step.fn(acc), a),
        describe: () => steps.map((step) => `${step.key}`).join(' -> '),
        steps: () => steps,
      };
    },
  };

  return pipeline as Pipe<A>;
}

/**
 * Runs a pipeline synchronously.
 *
 * @typeParam A - The type of the input value.
 * @typeParam B - The type of the output value.
 * @param pipeline - The pipeline to run.
 * @param value - The value to run the pipeline on.
 * @returns The result of the pipeline.
 *
 * @public
 */
function runSync<A, B>(pipeline: Pipe<A, B>, value: A): B {
  const steps = pipeline.steps();
  let currentValue: unknown = value;

  for (const step of steps) {
    if (step.fn) {
      currentValue = step.fn(currentValue as A);
      console.log('---- Async checking for: ', step.key, currentValue instanceof Promise);
      if (currentValue instanceof Promise) {
        throw new Error('Async functions are not supported in sync mode');
      }
    }
  }

  return currentValue as B;
}

export type { Pipe, PipeFn };
export { pipe, runSync };
