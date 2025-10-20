/**
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Any, MergeUnion, Prettify, PrimitiveTypeExtended } from './generics.ts';
import { logger } from './logger.ts';
import { isErr, isOk, ok, type Result } from './result.ts';

// TODO: Check if is necessary to allow async functions in all flow operators.
// FIXME: The bind operator destructs classes instances in the flow value.
// TODO: Add constructors for parallel and sequential flows.

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
type FlowMapping = 'success' | 'error' | 'both';

/**
 * The operators of the flow.
 *
 * @internal
 */
type FlowOperator =
  | 'tap'
  | 'ifThen'
  | 'ifThenElse'
  | 'bind'
  | 'map'
  | 'mapErr'
  | 'mapBoth'
  | 'assert'
  | 'action'
  | 'log';

/**
 * Standardized the value of the flow. Basically to ensure the shape of the value in flows with
 * {@link bind} operations.
 *
 * @remarks
 * Under the hood, it is a union of the input type and the bound properties.
 * See {@link MergeUnion} for more information.
 *
 * @internal
 */
type FlowValue<T> = MergeUnion<T>;

/**
 * Flow step is a representation of a function in a flow.
 * It contains relevant information to identify the step in the flow.
 * Useful for tracing, debugging and logging.
 *
 * @internal
 */
type FlowStep = {
  kind: 'sync' | 'async';
  operator: FlowOperator;
  mapping: FlowMapping;
  fn: FlowFunction;
};

/**
 * Binds a new property to the input object.
 * If the value is a primitive or array, the result is the value.
 * If the value is an object, the result is the object with the new property added.
 *
 * @internal
 */
type Bind<O, K extends string, V> = V extends never ? O
  : O extends PrimitiveTypeExtended ? Prettify<Record<K, V>>
  : MergeUnion<O & Record<K, V>>;

/**
 * Operator functions that handle different mapping behaviors.
 * Each operator processes the flow result according to its specific logic.
 *
 * @internal
 */
const mappings: Record<FlowMapping, (v: Any, step: FlowStep) => Any> = {
  // Processes success values only.
  success: (v: Any, step: FlowStep) => (isOk(v) ? step.fn(v) : v),

  // Processes error values only.
  error: (v: Any, step: FlowStep) => (isErr(v) ? step.fn(v) : v),

  // Processes both success and error values.
  both: (v: Any, step: FlowStep) => step.fn(v),
};

/**
 * Flow builder class.
 *
 * @internal
 */
class Flow<I, O, E, A extends 'sync' | 'async' = 'sync'> {
  /**
   * The steps of the flow.
   */
  public readonly steps: FlowStep[] = [];

  /**
   * Add a new step to the flow.
   *
   * @param operator - The operator type for the step.
   * @param mapping - The mapping of the step.
   * @param fn - The function to add to the flow.
   * @param logicFn - The logic to add to the flow.
   * @returns a new typed version of the flow which includes the new step.
   */
  private addStep(
    operator: FlowOperator,
    mapping: FlowMapping,
    fn: Any,
    logicFn?: (...args: Any[]) => Any,
  ) {
    const isAsync = fn.constructor.name === 'AsyncFunction';

    this.steps.push({
      kind: isAsync ? 'async' : 'sync',
      operator,
      mapping,
      fn: (v) => (logicFn ? logicFn(v) : fn(v)),
    });

    return isAsync ? (this as Flow<I, O, E, 'async'>) : (this as Flow<I, O, E, A>);
  }

  /**
   * Build the flow in a type-safe way, automatically inferring the flow input and output types.
   * Handles both sync and async steps. The returned function will be async if any step in the flow
   * is async.
   *
   * @returns A function that processes the flow with the correct input and output types.
   */
  public build() {
    // Checking if any step is async (omit tap steps which are side effects).
    const isAsync = this.steps.some((step) => step.kind === 'async' && step.operator !== 'tap');

    // Build the flow function.
    const buildFlow = isAsync
      ? async (v: I) =>
        await this.steps.reduce(
          async (v, step) => await mappings[step.mapping](await v, step),
          ok(v) as Any,
        )
      : (v: I) => this.steps.reduce((v, step) => mappings[step.mapping](v, step), ok(v));

    // Apply the correct type.
    return buildFlow as A extends 'async' ? ((v: I) => Promise<Result<MergeUnion<O>, E>>)
      : ((v: I) => Result<MergeUnion<O>, E>);
  }

  /**
   * Maps over the success value of the flow.
   * Transforms the success value using the provided function.
   * If the flow is in an error state, the error is preserved and the mapping is skipped.
   *
   * @remarks
   * Is recommended to use `map` instead of `bind` for primitive values or arrays.
   * Try to make simple mapping functions, otherwise use success operator such as `ifThen`,
   * `ifThenElse` or `bind`.
   *
   * @param fn - The function to apply to the success value. Must return a Result.
   * @returns a new typed version of the flow which includes the new step.
   */
  public map<B, F>(fn: (v: FlowValue<O>) => Result<B, F>): Flow<I, B, E | F, A>;
  public map<B, F>(
    fn: (v: FlowValue<O>) => Promise<Result<B, F>>,
  ): Flow<I, B, E | F, 'async'>;
  public map(fn: Any) {
    const mapLogic = (v: Any) => fn(v.value);
    return this.addStep('map', 'success', fn, mapLogic) as Any;
  }

  /**
   * Maps over the error value of the flow.
   *
   * @remarks
   * Is recommended to use `mapErr` if you want to transform or group errors under some
   * business logic.
   *
   * @param fn - The function to apply to the error value. Must return a Result.
   * @returns a new typed version of the flow which includes the new step.
   */
  public mapErr<B, F>(fn: (e: E) => Result<B, F>): Flow<I, O | B, F, A>;
  public mapErr<B, F>(
    fn: (e: E) => Promise<Result<B, F>>,
  ): Flow<I, O | B, F, 'async'>;
  public mapErr(fn: Any) {
    const mapErrLogic = (v: Any) => fn(v.error);
    return this.addStep('mapErr', 'error', fn, mapErrLogic) as Any;
  }

  /**
   * Maps over both the success and error values of the flow.
   * Transforms both the success and error values using the provided functions.
   * This method is always applied regardless of the flow state.
   *
   * @param fn - An object containing `onOk` and `onErr` functions to handle both cases.
   * @returns a new typed version of the flow which includes the new step.
   */
  public mapBoth<B, F>(fn: {
    onOk: (v: FlowValue<O>) => Result<B, F>;
    onErr: (e: E) => Result<B, F>;
  }): Flow<I, B, F, A>;
  public mapBoth<B, F>(fn: {
    onOk: (v: FlowValue<O>) => Promise<Result<B, F>>;
    onErr: (e: E) => Promise<Result<B, F>>;
  }): Flow<I, B, F, 'async'>;
  public mapBoth(fn: Any) {
    const mapBothLogic = (
      v: Any,
    ) => (isOk(v) ? fn.onOk(v.value) : fn.onErr(v.error));
    return this.addStep('mapBoth', 'both', fn, mapBothLogic) as Any;
  }

  /**
   * Performs a side effect on the flow value.
   *
   * @param fn - The function to apply to the flow value.
   * @returns a new typed version of the flow which includes the new step.
   */
  public tap(fn: (v: FlowValue<O>) => void): Flow<I, O, E, A>;
  public tap(fn: (v: FlowValue<O>) => Promise<void>): Flow<I, O, E, 'async'>;
  public tap(fn: Any) {
    const tapLogic = (v: Any) => (fn(v.value), v);
    return this.addStep('tap', 'success', fn, tapLogic) as Any;
  }

  /**
   * Asserts a predicate on the success value of the flow.
   * If the predicate returns true, the original value is returned unchanged.
   * If any predicate returns false, the flow returns an error.
   *
   * @remarks
   * This operator is useful for assertion checks where you want to ensure
   * a condition is met without transforming the value.
   *
   * @param predicate - The predicate function to assert the success value.
   * @returns a new typed version of the flow which includes the new step.
   */
  public assert<B, F>(
    ...fns: ((v: FlowValue<O>) => Result<B, F>)[]
  ): Flow<I, O, E | F, A>;
  public assert<B, F>(
    ...fns: ((v: FlowValue<O>) => Promise<Result<B, F>>)[]
  ): Flow<I, O, E | F, 'async'>;
  public assert(...fns: Any[]) {
    const assertLogic = (v: Any) => {
      for (const fn of fns) {
        const result = fn(v.value);

        if (result instanceof Promise) {
          return result.then((r) => (isErr(r) ? r : v));
        }

        return isErr(result) ? result : v;
      }
      return v;
    };
    return this.addStep('assert', 'success', fns, assertLogic) as Any;
  }

  /**
   * Binds a new property to the flow value.
   *
   * @remarks
   * It is useful generate and store new values related to the flow and will be used in
   * the next steps.
   *
   * @param key - The key for the new property.
   * @param fn - The function that computes the value for the new property.
   * @returns a new typed version of the flow which includes the new step.
   */
  public bind<K extends string, V, F>(
    key: K,
    fn: (v: FlowValue<O>) => Result<V, F>,
  ): Flow<I, Bind<FlowValue<O>, K, V>, E | F, A>;
  public bind<K extends string, V, F>(
    key: K,
    fn: (v: FlowValue<O>) => Promise<Result<V, F>>,
  ): Flow<I, Bind<FlowValue<O>, K, V>, E | F, 'async'>;
  public bind(key: string, fn: Any) {
    const isBindable = (v: Any) => typeof v === 'object' && v !== null && !Array.isArray(v);

    const bindLogic = (v: Any) => {
      const result = fn(v.value);

      if (result instanceof Promise) {
        return result.then((r) =>
          isOk(r)
            ? ok({
              ...(isBindable(v.value) ? { ...v.value } : {}),
              [key]: r.value,
            })
            : r
        );
      }

      return isOk(result)
        ? ok({
          ...(isBindable(v.value) ? { ...v.value } : {}),
          [key]: result.value,
        })
        : result;
    };

    return this.addStep('bind', 'success', fn, bindLogic) as Any;
  }

  /**
   * Performs an action related to the context of the flow with error handling, but without
   * changing the flow value.
   *
   * @remarks
   * It is useful for performing relevant changes for the flow such:
   * - Updating the state of a aggregate.
   * - Calculations with some constraints.
   * - etc.
   *
   * For logging, events, etc, use {@link tap} instead.
   *
   * @param fn - The function to apply to the flow value.
   * @returns a new typed version of the flow which includes the new step.
   */
  public action<B, F>(fn: (v: FlowValue<O>) => Result<B, F>): Flow<I, O, E | F, A>;
  public action<B, F>(fn: (v: FlowValue<O>) => Promise<Result<B, F>>): Flow<I, O, E | F, 'async'>;
  public action(fn: Any) {
    const actionLogic = (v: Any) => {
      const result = fn(v.value);

      // If the function is async, return the resolved value.
      if (result instanceof Promise) {
        return result.then((r) => (isErr(r) ? r : v));
      }
      return isErr(result) ? result : v;
    };
    return this.addStep('action', 'success', fn, actionLogic) as Any;
  }

  /**
   * Logs a message to the console (it acts as a debug side effect).
   *
   * @remarks
   * This operator is useful for logging steps in the flow.
   *
   * @param message - The message to log.
   * @returns a new typed version of the flow which includes the new step.
   */
  public log(message: string): Flow<I, O, E, A> {
    const logLogic = (v: Any) => (logger.debug(message), v);
    return this.addStep('log', 'success', message, logLogic) as Any;
  }
}

/**
 * Creates a new flow.
 *
 * @remarks
 * The flow is a composable pipeline for processing data with error handling.
 * Each step in the flow can transform data, handle errors, or perform side effects.
 * The flow automatically handles the propagation of success and error states.
 *
 * It can be used to create both sync and async flows and automatically infers the correct type
 * based on the steps in the flow.
 *
 * @returns A new flow.
 *
 * @public
 */
const flow = <I>() => new Flow<I, I, never>();

export { flow };
export type { Flow, FlowValue };
