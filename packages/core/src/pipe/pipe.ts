/*
 * This file is part of the Daikit project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import {
  type Any,
  type DeepAwaited,
  type HasPromise,
  type Prettify,
  getMetadata,
  setMetadata,
  toCamelCase,
} from '../utils';

/**
 * Metadata for a pipe function.
 *
 * @public
 */
type PipeMetadata = {
  /**
   * The name of the pipe.
   */
  name: string;
  /**
   * The operator of the pipe.
   */
  operator: string;
  /**
   * Whether the pipe is async.
   */
  isAsync: boolean;
};

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
type PipeStep<A = Any, B = Any> = {
  key: symbol;
  description: string;
  fn: PipeFn<A, B>;
};

/**
 * Helper type to detect if any step in the pipeline returns a Promise
 * @internal
 */
type HasAsyncStep<S extends PipeStep[]> = S extends [infer First, ...infer Rest]
  ? First extends { fn: infer F }
    ? F extends PipeFn<never, infer R>
      ? HasPromise<R> extends true
        ? true
        : Rest extends PipeStep[]
          ? HasAsyncStep<Rest>
          : false
      : false
    : false
  : false;

/**
 * Represents the result of the build function.
 * This type is used to ensure that the build function returns the correct type, depending on the
 * pipeline being async or not.
 *
 * @typeParam A - The type of the input value.
 * @typeParam B - The type of the output value.
 * @typeParam Async - Whether the pipeline is async.
 *
 * @internal
 */
type BuildResult<A, B, Async extends boolean> = Async extends true
  ? (value: A) => Promise<B>
  : (value: A) => Prettify<B>;

/**
 * The Pipe type represents a pipeline of functions that can be applied to a value.
 *
 * @typeParam A - The type of the input value.
 * @typeParam B - The type of the output value.
 * @typeParam S - The type of the steps array.
 *
 * @public
 */
type Pipe<I, O = I, S extends PipeStep[] = [], Async extends boolean = HasAsyncStep<[...S]>> = {
  /**
   * Adds a new step to the pipeline.
   * The new step will be added to the end of the pipeline and will be applied to the output
   * of the previous step.
   *
   * @param description - The description of the step.
   * @param fn - The function to apply to the pipeline.
   * @returns A new Pipe Builder.
   */
  step: <OF>(
    description: string,
    fn: PipeFn<O, OF>,
  ) => Pipe<I, DeepAwaited<OF>, [...S, PipeStep<O, OF>]>;

  /**
   * Returns the steps of the pipeline as a list of steps with the respective metadata.
   *
   * @returns The steps of the pipeline.
   */
  steps: () => Prettify<{
    name: string;
    steps: (Pick<PipeStep, 'key' | 'description'> & PipeMetadata)[];
  }>;

  /**
   * Builds the pipeline and returns a function that can be used to run the pipeline.
   * Depending on the pipeline being async or sync, the function will return a promise or a value.
   *
   * @returns The pipeline function.
   */
  build: () => BuildResult<I, O, Async>;
};

// *********************************************************************************************
// Private functions.
// *********************************************************************************************

/**
 * Builds an async pipeline.
 *
 * @typeParam A - The type of the input value.
 * @typeParam B - The type of the output value.
 * @param a - The input value.
 * @param steps - The steps of the pipeline.
 * @returns The async pipeline.
 *
 * @internal
 */
function buildAsyncPipe<A, B>(a: A, steps: PipeStep<A, B>[]) {
  return (async () => {
    let currentValue: Any = a;
    for (const step of steps) {
      currentValue = await step.fn(currentValue);

      if (typeof currentValue === 'object' && currentValue !== null) {
        for (const [key, value] of Object.entries(currentValue)) {
          if (value instanceof Promise) {
            currentValue[key] = await value;
          }
        }
      }
    }

    return currentValue;
  })();
}

/**
 * Builds a sync pipeline.
 *
 * @typeParam A - The type of the input value.
 * @typeParam B - The type of the output value.
 * @param a - The input value.
 * @param steps - The steps of the pipeline.
 * @returns The sync pipeline.
 *
 * @internal
 */
function buildSyncPipe<A, B>(a: A, steps: PipeStep<A, B>[]) {
  return steps.reduce<Any>((acc, step) => step.fn(acc), a);
}

// *********************************************************************************************
// Public functions.
// *********************************************************************************************

/**
 * Applies the given metadata to the pipe function.
 * If metadata is not provided, it will be inferred from the function.
 *
 * @param fn - The pipe function to create metadata for.
 * @param metadata - The metadata object.
 * @returns The pipe function with the metadata applied.
 *
 * @public
 */
function withPipeMetadata<F extends PipeFn<Any, Any>, M extends PipeMetadata>(fn: F, metadata?: M) {
  let existingMetadata: PipeMetadata | undefined;
  try {
    existingMetadata = getMetadata<PipeMetadata>(fn);
  } catch {
    existingMetadata = undefined;
  }

  if (!existingMetadata) {
    // If no metadata is provided, we infer it from the function.
    const { name, operator = 'function', isAsync } = metadata ?? {};

    setMetadata(fn, {
      name: name || fn.name || toCamelCase(`${operator}_${Date.now()}`),
      operator,
      isAsync: isAsync || fn.constructor.name === 'AsyncFunction',
    });
  }

  return fn;
}

/**
 * Creates a new Pipe Builder.
 *
 * @typeParam A - The type of the input value.
 * @param name - The name of the pipeline.
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
function pipe<A>(name: string): Pipe<A, A, []> {
  const steps: PipeStep[] = [];
  const pipelineName = name;

  const pipeline = {
    step: <C>(description: string, fn: PipeFn<A, C>) => {
      // Registering the step in the steps array, and applying the metadata to the function.
      // If the metadata is not provided, it will be inferred from the function.
      steps.push({ key: Symbol(description), description, fn: withPipeMetadata(fn) });

      // Returning a new Pipe Builder with the new step added.
      return {
        step: <D>(nextDescription: string, nextFn: PipeFn<C, D>) =>
          pipeline.step(nextDescription, nextFn as Any),
        steps: () => {
          return {
            name: pipelineName,
            steps: steps.map((step) => ({
              key: step.key,
              description: step.description,
              ...getMetadata<PipeMetadata>(step.fn),
            })),
          };
        },
        // If we have steps, we need to build the runner function.
        build: () => (a: A) => {
          const isAsync = steps.some((step) => getMetadata<PipeMetadata>(step.fn).isAsync);
          return isAsync ? buildAsyncPipe(a, steps) : buildSyncPipe(a, steps);
        },
      };
    },
    // If no steps are added, the pipeline is empty and the steps will be an empty array.
    steps: () => {
      return {
        name: pipelineName,
        steps: [],
      };
    },
    // If no steps are added, the pipeline is empty and the build function will return the
    // input value.
    build: () => (a: A) => a,
  };

  return pipeline as Pipe<A, A, []>;
}

export type { Pipe, PipeFn, PipeMetadata };
export { pipe, withPipeMetadata };
