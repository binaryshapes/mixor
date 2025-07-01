/*
 * This file is part of the Daikit project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { Any } from './generics';
import { type Result, isErr, isOk, ok } from './result';

// TODO: Infer the flow input from the first step (support for primitives, arrays and objects).
// TODO: Implement flow operators (mapErr, mapBoth, tap, bind, ifThen, ifThenElse, etc).

/**
 * A function that can be used as a step in a flow.
 * Can be either sync or async and must return a Result.
 *
 * @internal
 */
type FlowFunction = (a: Any) => Result<Any, Any> | Promise<Result<Any, Any>>;

/**
 * The required mapping of a flow operator.
 *
 * @internal
 */
type FlowMapping = 'success' | 'error' | 'both' | 'sideEffect';

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
  mapping: FlowMapping;
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
  map: {
    /**
     * Maps over the success value of the flow.
     * Transforms the success value using the provided function.
     *
     * @param fn - The function to apply to the flow.
     * @returns A new Flow with the transformed success value.
     */
    <B, F extends string>(fn: (v: O) => Result<B, F>): Flow<I, B, E | F, A>;
    <B, F extends string>(fn: (v: O) => Promise<Result<B, F>>): Flow<I, B, E | F, 'async'>;
  };

  mapErr: {
    /**
     * Maps over the error type of the flow.
     * Transforms errors using the provided function.
     *
     * @param fn - The function to apply to the flow.
     * @returns A new Flow with the transformed error value.
     */
    <B, F extends string>(fn: (e: E) => Result<B, F>): Flow<I, O | B, F, A>;
    <B, F extends string>(fn: (e: E) => Promise<Result<B, F>>): Flow<I, O | B, F, 'async'>;
  };

  mapBoth: {
    /**
     * Maps over both the success and error values of the flow.
     * Transforms both the success and error values using the provided function.
     *
     * @param fn - The function to apply to the flow.
     * @returns A new Flow with the transformed success and error values.
     */
    <B, F extends string>(fn: {
      onOk: (v: O) => Result<B, F>;
      onErr: (e: E) => Result<B, F>;
    }): Flow<I, B, F, A>;
    <B, F extends string>(fn: {
      onOk: (v: O) => Promise<Result<B, F>>;
      onErr: (e: E) => Promise<Result<B, F>>;
    }): Flow<I, B, F, 'async'>;
  };

  tap: {
    /**
     * A tap is a side-effect function that does not change the flow result.
     * It is useful for logging, debugging, tracing, etc.
     * Only is applied if the flow result is a success.
     *
     * @param fn - The function to apply to the flow.
     * @returns A new Flow with the side-effect applied.
     */
    (fn: (v: O) => void): Flow<I, O, E, A>;
    (fn: (v: O) => Promise<void>): Flow<I, O, E, 'async'>;
  };

  /**
   * Builds the flow in a type-safe way, automatically inferring the flow input and output types.
   * Handles both sync and async steps.
   *
   * @returns A function that processes the flow.
   */
  build: A extends 'async' ? () => (v: I) => Promise<Result<O, E>> : () => (v: I) => Result<O, E>;

  /**
   * The steps of the flow.
   */
  steps: () => FlowStep[];
};

/**
 * Operator functions that handle different mapping behaviors.
 * Each operator processes the flow result according to its specific logic.
 *
 * @internal
 */
const mappings: Record<FlowMapping, (v: Any, step: FlowStep) => Any> = {
  /**
   * Processes success values only.
   * @param v - The value to process.
   * @param step - The step to process.
   * @returns The processed value.
   */
  success: (v: Any, step: FlowStep) => (isOk(v) ? step.fn(v.value) : v),

  /**
   * Processes error values only.
   * @param v - The value to process.
   * @param step - The step to process.
   * @returns The processed value.
   */
  error: (v: Any, step: FlowStep) => (isErr(v) ? step.fn(v.error) : v),

  /**
   * Processes both success and error values.
   * @param v - The value to process.
   * @param step - The step to process.
   * @returns The processed value.
   */
  both: (v: Any, step: FlowStep) =>
    isOk(v) ? (step.fn as Any).onOk(v.value) : (step.fn as Any).onErr(v.error),

  /**
   * Processes a side-effect function without changing anything in the flow.
   * @param v - The value to process.
   * @param step - The step to process.
   * @returns The processed value.
   */
  sideEffect: (v: Any, step: FlowStep) => {
    if (isOk(v)) {
      step.fn(v.value);
    }

    return v;
  },
};

/**
 * Builds a flow function (sync or async) based on the provided steps.
 * The function processes each step according to its mapping behavior.
 *
 * @param steps - The steps of the flow.
 * @param isAsync - Whether to build an async flow.
 * @returns A function that processes the flow.
 *
 * @internal
 */
const buildFlow = <I>(steps: FlowStep[], isAsync: boolean) =>
  isAsync
    ? async (v: I) =>
        steps.reduce(async (v, step) => await mappings[step.mapping](await v, step), ok(v) as Any)
    : (v: I) => steps.reduce((v, step) => mappings[step.mapping](v, step), ok(v));

/**
 * Creates a flow method that adds a step and returns the appropriate flow type.
 *
 * @param steps - The steps array to add to.
 * @param operator - The operator type for the step.
 * @param mapping - The mapping of the step.
 * @param api - The flow API object to return.
 * @returns A function that creates a step and returns the flow.
 *
 * @internal
 */
const flowFunction =
  <I>(steps: FlowStep[], operator: string, mapping: FlowMapping, api: Any) =>
  (fn: FlowFunction) => {
    const step = {
      _tag: 'Step',
      kind: fn.constructor.name === 'AsyncFunction' ? 'async' : 'sync',
      fn,
      hash: fn.toString(),
      operator,
      mapping,
    } satisfies FlowStep;

    steps.push(step);
    return api as Flow<I, Any, Any, typeof step.kind>;
  };

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
    build: () =>
      buildFlow<I>(
        steps,
        steps.some((step) => step.kind === 'async'),
      ),
    steps: () => steps,
  };

  api.map = flowFunction<I>(steps, 'map', 'success', api);
  api.mapErr = flowFunction<I>(steps, 'mapErr', 'error', api);
  api.mapBoth = flowFunction<I>(steps, 'mapBoth', 'both', api);
  api.tap = flowFunction<I>(steps, 'tap', 'sideEffect', api);
  return api;
}

export type { Flow };
export { flow };
