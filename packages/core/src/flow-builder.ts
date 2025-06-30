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
  mapping: 'success' | 'error' | 'both';
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
   * Maps over the success value of the flow.
   * Transforms the success value using the provided function.
   *
   * @param fn - The function to apply to the flow.
   * @returns A new Flow with the transformed success value.
   */
  map: {
    <B, F extends string>(fn: (a: O) => Result<B, F>): Flow<I, B, E | F, A>;
    <B, F extends string>(fn: (a: O) => Promise<Result<B, F>>): Flow<I, B, E | F, 'async'>;
  };

  /**
   * Maps over the error type of the flow.
   * Transforms errors using the provided function.
   *
   * @param fn - The function to apply to the flow.
   * @returns A new Flow with the transformed error value.
   */
  mapErr: {
    <B, F extends string>(fn: (error: E) => Result<B, F>): Flow<I, B, F, A>;
    <B, F extends string>(fn: (error: E) => Promise<Result<B, F>>): Flow<I, B, F, 'async'>;
  };

  /**
   * Maps over both the success and error values of the flow.
   * Transforms both the success and error values using the provided function.
   *
   * @param fn - The function to apply to the flow.
   * @returns A new Flow with the transformed success and error values.
   */
  mapBoth: {
    <B, F extends string>(
      fn: MapBothOptions<O, B, E, F>['sync'] | MapBothOptions<O, B, E, F>['async'],
    ): Flow<I, B, F, A>;
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
 * Builds a flow function (sync or async) based on the provided steps.
 * The function processes each step according to its mapping behavior.
 *
 * @param steps - The steps of the flow.
 * @param isAsync - Whether to build an async flow.
 * @returns A function that processes the flow.
 *
 * @internal
 */
const buildFlow = <I>(steps: FlowStep[], isAsync: boolean) => {
  const reducer = (v: Any, step: FlowStep) => operators[step.mapping](v, step);

  return isAsync
    ? async (input: I) =>
        steps.reduce(async (v, step) => await reducer(await v, step), ok(input) as Any)
    : (input: I) => steps.reduce((v, step) => reducer(v, step), ok(input));
};

/**
 * Maps flow operators to their corresponding mapping behavior.
 * This mapping determines how each operator processes the flow's result.
 *
 * - `'success'`: Only processes successful results (ok values)
 * - `'error'`: Only processes error results (err values)
 * - `'both'`: Processes both success and error results
 *
 * @internal
 */
const operatorMapping: Record<string, 'success' | 'error' | 'both'> = {
  map: 'success',
  mapErr: 'error',
  mapBoth: 'both',
  function: 'success',
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
  mapping: operatorMapping[operator],
});

/**
 * Creates a flow method that adds a step and returns the appropriate flow type.
 *
 * @param steps - The steps array to add to.
 * @param operator - The operator type for the step.
 * @param api - The flow API object to return.
 * @returns A function that creates a step and returns the flow.
 *
 * @internal
 */
const flowFunction =
  <I>(steps: FlowStep[], operator: string, api: Any) =>
  (fn: FlowFunction) => {
    const step = makeStep(fn, operator);
    steps.push(step);
    return step.kind === 'async' ? (api as Flow<I, Any, Any, 'async'>) : api;
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

  api.map = flowFunction<I>(steps, 'map', api);
  api.mapErr = flowFunction<I>(steps, 'mapErr', api);
  api.mapBoth = flowFunction<I>(steps, 'mapBoth', api);
  return api;
}

// *********************************************************************************************
// Operators logics.
// *********************************************************************************************

type MapBothOptions<A, B, E, F> = {
  sync: {
    ok: (value: A) => Result<B, F>;
    err: (error: E) => Result<B, F>;
  };
  async: {
    ok: (value: A) => Promise<Result<B, F>>;
    err: (error: E) => Promise<Result<B, F>>;
  };
};

/**
 * Operator functions that handle different mapping behaviors.
 * Each operator processes the flow result according to its specific logic.
 *
 * @internal
 */
const operators = {
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
    isOk(v)
      ? (step.fn as unknown as MapBothOptions<Any, Any, Any, Any>[typeof step.kind]).ok(v.value)
      : (step.fn as unknown as MapBothOptions<Any, Any, Any, Any>[typeof step.kind]).err(v.error),
};

export type { Flow };
export { flow };
