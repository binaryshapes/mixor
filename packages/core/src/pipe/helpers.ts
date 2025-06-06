/*
 * This file is part of the Daikit project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { Any, ArrayHasType, CompactArray, HomogeneousTuple } from '../utils';
import { type Pipe, type PipeFn, pipe } from './pipe';

// *********************************************************************************************
// Private types.
// *********************************************************************************************

/**
 * Infers the return type of an array of pipeline functions.
 *
 * @typeParam T - The input type of the pipelines.
 * @typeParam P - The array of pipeline functions.
 *
 * @internal
 */
type InferOutput<P> = P extends Pipe<Any, Any, Any>[]
  ? {
      [K in keyof P]: P[K] extends Pipe<Any, infer R, Any> ? R : never;
    }
  : never;

/**
 * Infers the input type of an array of pipeline functions.
 *
 * @typeParam P - The array of pipeline functions.
 *
 * @internal
 */
type InferInput<P> = P extends Pipe<Any, Any, Any>[]
  ? {
      [K in keyof P]: P[K] extends Pipe<infer I, Any, Any> ? I : never;
    }
  : never;

/**
 * Checks if any pipeline in the array is async.
 *
 * @typeParam P - The array of pipeline functions.
 *
 * @internal
 */
type IsPromise<P> = ArrayHasType<
  P extends Pipe<Any, Any, Any>[]
    ? {
        [K in keyof P]: P[K] extends Pipe<Any, Any, infer B> ? B : never;
      }
    : never,
  true
>;

/**
 * Infers the complete pipe type for a parallel operation.
 *
 * @typeParam P - The array of pipeline functions.
 *
 * @internal
 */
type InferParallelPipe<P> = P extends Pipe<Any, Any, Any>[]
  ? Pipe<InferInput<P>, InferOutput<P>, IsPromise<P>>
  : never;

/**
 * Infers the complete pipe type for a parallel operation.
 *
 * @typeParam P - The array of pipeline functions.
 *
 * @internal
 */
type InferAllParallelPipe<P> = P extends Pipe<Any, Any, Any>[]
  ? Pipe<
      HomogeneousTuple<InferInput<P>> extends true ? CompactArray<InferInput<P>> : never,
      InferOutput<P>,
      IsPromise<P>
    >
  : never;

/**
 * Infers the complete pipe type for a flow operation.
 *
 * @typeParam P - The array of pipeline functions.
 *
 * @internal
 */
type InferFlowPipe<P> = P extends Pipe<Any, Any, Any>[]
  ? Pipe<
      HomogeneousTuple<InferInput<P>> extends true ? CompactArray<InferInput<P>> : never,
      HomogeneousTuple<InferOutput<P>> extends true ? CompactArray<InferOutput<P>> : never,
      IsPromise<P>
    >
  : never;

// *********************************************************************************************
// Internal functions.
// *********************************************************************************************

/**
 * Checks if any pipeline in the array is async.
 *
 * @param pipelines - The pipelines to check.
 * @returns True if the pipeline is async, false otherwise.
 *
 * @internal
 */
const isAsync = (pipelines: Pipe<Any, Any, Any>[]) =>
  pipelines.some((p) => p.steps().steps.some((s) => s.isAsync));

/**
 * Resolves a parallel pipe.
 *
 * @param name - The name of the pipe.
 * @param pipelines - The pipelines to run in parallel.
 * @returns A new pipe that runs all pipelines in parallel.
 *
 * @internal
 */
function resolveParallel<I, R, P>(name: string, pipelines: Pipe<I, Any, Any>[]) {
  // A loop that can handle both arrays and single values.
  const loop = (v: I) =>
    Array.isArray(v)
      ? pipelines.map((p, i) => p.build()(v[i]))
      : pipelines.map((p) => p.build()(v));

  // Can be sync or async depending on the pipelines.
  const step = isAsync(pipelines) ? async (v: I) => await Promise.all(loop(v)) : (v: I) => loop(v);

  return pipe<I>(name).step(
    pipelines.map((p) => p.steps().name).join(' and '),
    step as PipeFn<I, R>,
  ) as P;
}

// *********************************************************************************************
// Public helpers.
// *********************************************************************************************

/**
 * Creates a parallel pipe that combines multiple pipelines and runs them in parallel.
 * The results are returned in an array in the same order as the input pipelines.
 * Each pipeline can have its input and output types.
 *
 * Notes:
 * - Each pipeline receives a separate input (by index).
 * - Each pipeline can have a different input and output type.
 * - The final result is an array that preserves the order of the pipelines.
 *
 * ```text
 *  Parallel execution with different inputs:
 *
 *              ┌────────────┐
 *   Input[0] ─▶│ Pipeline 1 │──┐
 *              └────────────┘  │
 *   Input[1] ─▶│ Pipeline 2 │──┼──▶ [ result1, result2, result3 ]
 *              └────────────┘  │
 *   Input[2] ─▶│ Pipeline 3 │──┘
 *              └────────────┘
 *
 *
 * Example with values:
 *
 *              (number)   (number)   (number)
 * Inputs:     [   5     ,   10    ,   200   ]
 *                │           │          │
 *                ▼           ▼          ▼
 *           ┌────────┐  ┌────────┐  ┌────────────┐
 *           │ Double │  │ Square │  │ Stringify  │
 *           └────────┘  └────────┘  └────────────┘
 *                │           │          │
 *                ▼           ▼          ▼
 * Results:    [   10    ,   100   ,   "200"  ]
 *              (number)   (number)   (string)
 *
 * ```
 *
 * @param pipelines - The pipelines to run in parallel.
 * @returns A new pipe that runs all pipelines in parallel.
 *
 * @example
 * ```ts
 * const double = pipe<number>('Double').step('Double', async (n) => n * 2);
 * const square = pipe<number>('Square').step('Square', (n) => n * n);
 * const stringify = pipe<number>('Stringify').step('Stringify', (n) => n.toString());
 * const parallelPipe = parallel(double, square, stringify).build();
 * const result = await parallelPipe([5, 10, 200]); // [10, 100, '200']
 * ```
 *
 * @public
 */
const parallel = <P extends Pipe<Any, Any, Any>[]>(...pipelines: P) =>
  resolveParallel<InferInput<P>, InferOutput<P>, InferParallelPipe<P>>('Parallel', pipelines);

/**
 * Creates a new pipe that runs all pipelines in parallel with the same input type.
 * The results are returned in an array in the same order as the input pipelines.
 * Each pipeline can have its own return type.
 *
 * Notes:
 * - All pipelines receive the same input in parallel.
 * - Outputs can be of different types.
 * - The result is an array preserving the order of pipelines.
 *
 * ```text
 * Parallel execution diagram:
 *
 *              ┌────────────┐
 *        ┌──▶  │ Pipeline 1 │ ──┐
 *        │     └────────────┘   │
 * Input ─┼──▶  │ Pipeline 2 │ ──┼──▶ [ result1, result2, ... ]
 *        │     └────────────┘   │
 *        └──▶  │ Pipeline N │ ──┘
 *              └────────────┘
 *
 * Example with values:
 *
 *             ┌──────────────────────┐
 *     5 ───▶  │ Double: (n) => n * 2 │ ──▶ 10
 *             └──────────────────────┘
 *        └──▶ │ ToString: n => "5"   │ ──▶ "5"
 *             └──────────────────────┘
 *                         │
 *                         ▼
 *                   Result: [10, "5"]
 * ```
 *
 * @param pipelines - The pipelines to run in parallel.
 * @returns A new pipe that runs all pipelines in parallel.
 *
 * @example
 * ```ts
 * const double = pipe<number>('Double').step('Double', async (n) => n * 2);
 * const stringify = pipe<number>('Stringify').step('Stringify', (n) => n.toString());
 * const allPipe = all(double, stringify).build();
 * const result = await allPipe(5); // [10, '5']
 * ```
 *
 * @public
 */
const all = <P extends Pipe<Any, Any, Any>[]>(...pipelines: P) =>
  resolveParallel<
    CompactArray<InferInput<P>>,
    CompactArray<InferOutput<P>>,
    InferAllParallelPipe<P>
  >('All in parallel', pipelines);

/**
 * Creates a new pipe that runs all pipelines in sequence using a single input as starting point.
 * It is useful when you have a single input and you want to run a series of pipelines that are
 * related to each other but defined separately.
 *
 * Notes:
 * - Each pipeline must be type-compatible.
 * - The output of Pipeline N must match the input type of Pipeline N+1.
 *
 * ```text
 *             ┌───────────┐     ┌───────────┐     ┌───────────┐
 * Input ───▶  │ Pipeline 1│ ──▶ │ Pipeline 2│ ──▶ │ Pipeline 3│ ──▶ Output
 *             └───────────┘     └───────────┘     └───────────┘
 *
 * Example with values:
 *
 *             ┌────────────────────┐     ┌────────────────────┐
 *     5 ───▶  │ Double: (n) => n*2 │ ──▶ │ Pow: (n) => n ** 2 │ ──▶ 100
 *             └────────────────────┘     └────────────────────┘
 *
 * ```
 *
 * @param pipelines - The pipelines to run in sequence.
 * @returns A new pipe that runs all pipelines in sequence.
 *
 * @example
 * ```ts
 * const double = pipe<number>('Double').step('Double', (n) => n * 2);
 * const pow = pipe<number>('Pow').step('Pow', (n) => n * n);
 * const flowPipe = flow(double, pow).build();
 * const result = flowPipe(5); // 100
 * ```
 *
 * @public
 */
const flow = <P extends Pipe<Any, Any, Any>[]>(...pipelines: P) =>
  // FIXME: The type inference is not working as expected when the pipeline input is different
  // from the output of the previous pipeline or something like that.
  pipelines.reduce(
    (r, p) =>
      r.step(p.steps().name, isAsync(pipelines) ? async (v) => await p.build()(v) : p.build()),
    pipe<Any>('Flow in sequence'),
  ) as InferFlowPipe<P>;

export { parallel, all, flow };
