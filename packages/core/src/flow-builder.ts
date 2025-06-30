/*
 * This file is part of the Daikit project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { Any } from './generics';
import { Panic } from './panic';
import { type Result, isOk, ok } from './result';

// TODO: Store steps metadata to the flow.
// TODO: Infer the flow input from the first step (support for primitives, arrays and objects).
// TODO: Implement flow operators (mapErr, mapBoth, tap, bind, ifThen, ifThenElse, etc).

/**
 * Panic error for the flow module.
 *
 * @public
 */
class FlowError extends Panic<
  'FLOW',
  // An async step was found in a sync flow.
  | 'ASYNC_STEP_IN_SYNC_FLOW'
  // No async steps found in a async flow.
  | 'NO_ASYNC_STEPS_IN_ASYNC_FLOW'
>('FLOW') {}

/**
 * A function that can be used as a step in a flow.
 * Can be either sync or async and must return a Result.
 *
 * @internal
 */
type FlowFunction = (a: Any) => Result<Any, Any> | Promise<Result<Any, Any>>;

/**
 * Flow step is a representation of a function in a flow.
 * It contains relevant information to identify the step in the flow.
 * Useful for tracing, debugging and logging.
 *
 * @internal
 */
type FlowStep = {
  _tag: 'Step';
  kind: 'sync' | 'async';
  fn: FlowFunction;
  hash: string;
  operator: string;
};

/**
 * Type-safe Result flow with correct type inference for each step.
 * Supports both sync and async steps, with explicit build methods.
 *
 * @typeParam I - The type of the input value.
 * @typeParam O - The type of the output value.
 * @typeParam E - The union of all error types.
 *
 * @public
 */
type Flow<I, O, E, A extends 'sync' | 'async' = 'sync'> = {
  /**
   * Adds a new step to the flow.
   * The step can be either sync or async.
   *
   * @param fn - The function to apply to the flow.
   * @returns A new Flow with the step added.
   */
  step: {
    <B, F extends string>(fn: (a: O) => Result<B, F>): Flow<I, B, E | F, A>;
    <B, F extends string>(fn: (a: O) => Promise<Result<B, F>>): Flow<I, B, E | F, 'async'>;
  };

  /**
   * Builds the flow in a type-safe way, automatically inferring the flow input and output types.
   * Handles both sync and async steps.
   *
   * @returns A function that processes the flow.
   */
  build: A extends 'async'
    ? () => (input: I) => Promise<Result<O, E>>
    : () => (input: I) => Result<O, E>;

  /**
   * The steps of the flow.
   */
  steps: () => FlowStep[];
};

/**
 * Builds a sync flow.
 * Throws an error if any step is async.
 *
 * @param fns - The functions of the flow.
 * @returns A sync function that processes the flow.
 * @throws A {@link FlowError} if any step is async.
 *
 * @internal
 */
const buildSync =
  <I>(fns: FlowFunction[]) =>
  () =>
  (input: I) => {
    let result: Result<Any, Any> = ok(input);
    for (const fn of fns) {
      if (isOk(result)) {
        const nextResult = fn(result.value);
        if (nextResult instanceof Promise) {
          throw new FlowError(
            'ASYNC_STEP_IN_SYNC_FLOW',
            'Async step found in sync flow. Use buildAsync instead.',
          );
        }
        result = nextResult;
      }
    }
    return result;
  };

/**
 * Builds an async flow.
 * Supports both sync and async steps.
 *
 * @param fns - The functions of the flow.
 * @returns An async function that processes the flow.
 * @throws A {@link FlowError} if no async steps are found.
 *
 * @internal
 */
const buildAsync =
  <I>(fns: FlowFunction[]) =>
  async (input: I) => {
    let result: Result<Any, Any> = ok(input);
    for (const fn of fns) {
      if (isOk(result)) {
        const nextResult = fn(result.value);
        result = nextResult instanceof Promise ? await nextResult : nextResult;
      }
    }
    return result;
  };

/**
 * Creates a new flow step.
 *
 * @param fn - The function to create a step from.
 * @param operator - The operator to use for the step.
 * @returns A new flow step.
 *
 * @internal
 */
const makeStep = (fn: FlowFunction, operator = 'function'): FlowStep => ({
  _tag: 'Step',
  kind: fn.constructor.name === 'AsyncFunction' ? 'async' : 'sync',
  fn,
  hash: fn.toString(),
  operator,
});

/**
 * Creates a new Result flow.
 * This flow supports both sync and async steps with explicit build methods.
 *
 * @typeParam I - The type of the input value.
 * @returns A new Flow.
 *
 * @example
 * ```ts
 * // Sync flow.
 * const syncFlow = flow<{ a: number; b: number }>()
 *   .step(({ a, b }) => b === 0 ? err('DIVIDE_BY_ZERO') : ok(a / b))
 *   .step((n) => ok(n + 1))
 *   .build();
 *
 * const result = syncFlow({ a: 10, b: 2 }); // Result<number, "DIVIDE_BY_ZERO">
 *
 * // Async flow.
 * const asyncFlow = flow<{ a: number; b: number }>()
 *   .step(async ({ a, b }) => b === 0 ? err('DIVIDE_BY_ZERO') : ok(a / b))
 *   .step(async (n) => ok(n + 1))
 *   .buildAsync();
 *
 * const asyncResult = await asyncFlow({ a: 10, b: 2 }); // Promise<Result<number, "DIVIDE_BY_ZERO">>
 * ```
 *
 * @public
 */
function flow<I>(): Flow<I, I, never> {
  const steps: FlowStep[] = [];

  const api: Any = {
    // Step processor.
    step(fn: FlowFunction) {
      const step = makeStep(fn);
      steps.push(step);
      return step.kind === 'async' ? (api as Flow<I, Any, Any, 'async'>) : api;
    },

    // Flow builder.
    build: () => {
      const fns = steps.map((step) => step.fn);
      return fns.some((fn) => fn.constructor.name === 'AsyncFunction')
        ? buildAsync<I>(fns)
        : buildSync<I>(fns);
    },

    // Steps list.
    steps: () => steps,
  };
  return api;
}

export type { Flow };
export { flow, FlowError };
