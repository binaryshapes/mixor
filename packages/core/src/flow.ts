/*
 * This file is part of the Daikit project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { Any, MergeUnion, Prettify, PrimitiveTypeExtended } from './generics';
import { type Result, isErr, isOk, ok } from './result';

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
type FlowOperator = 'tap' | 'ifThen' | 'ifThenElse' | 'bind' | 'map' | 'mapErr' | 'mapBoth';

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
  _tag: 'Step';
  kind: 'sync' | 'async';
  fn: FlowFunction;
  hash: string;
  operator: FlowOperator;
  mapping: FlowMapping;
};

/**
 * Binds a new property to the input object.
 * If the value is a primitive or array, the result is the value.
 * If the value is an object, the result is the object with the new property added.
 *
 * @internal
 */
type Bind<O, K extends string, V> = V extends never
  ? O
  : O extends PrimitiveTypeExtended
    ? Prettify<Record<K, V>>
    : MergeUnion<O & Record<K, V>>;

/**
 * Type-safe Result flow with correct type inference for each step.
 * Supports both sync and async steps, with explicit build methods.
 *
 * A Flow is a composable pipeline for processing data with error handling.
 * Each step in the flow can transform data, handle errors, or perform side effects.
 * The flow automatically handles the propagation of success and error states.
 *
 * Key features:
 * - Type-safe: Full TypeScript support with automatic type inference
 * - Error handling: Built-in error propagation and transformation
 * - Composable: Chain multiple operations together
 * - Async support: Mix sync and async operations seamlessly
 * - Side effects: Support for logging, debugging, and tracing
 *
 * @typeParam I - The type of the input value.
 * @typeParam O - The type of the output value.
 * @typeParam E - The union of all error types.
 * @typeParam A - Whether the flow is sync or async.
 *
 * @public
 */
type Flow<I, O, E, A extends 'sync' | 'async' = 'sync'> = {
  map: {
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
     * @returns A new Flow with the transformed success value.
     *
     * @example
     * ```ts
     * const fl = flow<{ name: string; age: number }>()
     *   .map((user) => ok({ ...user, isAdult: user.age >= 18 }))
     *   .map((user) => user.age > 65 ? err('TOO_OLD') : ok(user))
     *   .build();
     *
     * // Success case
     * const result = fl({ name: 'Alice', age: 25 });
     * // Result<{ name: string; age: number; isAdult: boolean }, "TOO_OLD">
     *
     * // Error case - mapping is skipped
     * const errorResult = fl({ name: 'Bob', age: 70 });
     * // Result<never, "TOO_OLD">
     * ```
     */
    <B, F>(fn: (v: FlowValue<O>) => Result<B, F>): Flow<I, B, E | F, A>;
    <B, F>(fn: (v: FlowValue<O>) => Promise<Result<B, F>>): Flow<I, B, E | F, 'async'>;
  };

  mapErr: {
    /**
     * Maps over the error value of the flow.
     * Transforms errors using the provided function.
     * If the flow is in a success state, the success value is preserved and error mapping
     * is skipped.
     *
     * @remarks
     * Is recommended to use `mapErr` if you want to transform or group errors under some
     * business logic.
     *
     * @param fn - The function to apply to the error value. Must return a Result.
     * @returns A new Flow with the transformed error value.
     *
     * @example
     * ```ts
     * const fl = flow<{ id: string }>()
     *   .map((data) => data.id === 'invalid' ? err('INVALID_ID') : ok(data))
     *   .mapErr((error) => ok({ error, timestamp: Date.now() }))
     *   .build();
     *
     * // Error case - error is transformed
     * const errorResult = fl({ id: 'invalid' });
     * // Result<{ error: string; timestamp: number }, never>
     *
     * // Success case - error mapping is skipped
     * const successResult = fl({ id: 'valid' });
     * // Result<{ id: string }, never>
     * ```
     */
    <B, F>(fn: (e: E) => Result<B, F>): Flow<I, O | B, F, A>;
    <B, F>(fn: (e: E) => Promise<Result<B, F>>): Flow<I, O | B, F, 'async'>;
  };

  mapBoth: {
    /**
     * Maps over both the success and error values of the flow.
     * Transforms both the success and error values using the provided functions.
     * This method is always applied regardless of the flow state.
     *
     * @remarks
     * Is recommended to use `mapBoth` if you want to transform both the success and error values
     * in just one place.
     *
     * @param fn - An object containing `onOk` and `onErr` functions to handle both cases.
     * @returns A new Flow with the transformed values.
     *
     * @example
     * ```ts
     * const fl = flow<{ value: number }>()
     *   .map((data) => data.value > 10 ? err('TOO_HIGH') : ok(data))
     *   .mapBoth({
     *     onOk: (data) => ok({ ...data, status: 'success' }),
     *     onErr: (error) => ok({ error, status: 'failed' })
     *   })
     *   .build();
     *
     * // Success case
     * const successResult = fl({ value: 5 });
     * // Result<{ value: number; status: string }, never>
     *
     * // Error case
     * const errorResult = fl({ value: 15 });
     * // Result<{ error: string; status: string }, never>
     * ```
     */
    <B, F>(fn: {
      onOk: (v: FlowValue<O>) => Result<B, F>;
      onErr: (e: E) => Result<B, F>;
    }): Flow<I, B, F, A>;
    <B, F>(fn: {
      onOk: (v: FlowValue<O>) => Promise<Result<B, F>>;
      onErr: (e: E) => Promise<Result<B, F>>;
    }): Flow<I, B, F, 'async'>;
  };

  tap: {
    /**
     * A tap is a side-effect function that does not change the flow result.
     * It is useful for logging, debugging, tracing, etc.
     * Only applied if the flow result is a success. Errors are preserved unchanged.
     *
     * @param fn - The side-effect function to execute. Return value is ignored.
     * @returns A new Flow with the side-effect applied.
     *
     * @example
     * ```ts
     * const fl = flow<{ name: string; age: number }>()
     *   .tap((user) => console.log('Processing user:', user.name))
     *   .map((user) => ok({ ...user, isAdult: user.age >= 18 }))
     *   .tap((user) => console.log('User processed:', user.isAdult))
     *   .build();
     *
     * // Executes side effects and returns the same result
     * const result = fl({ name: 'Alice', age: 25 });
     * // Console: "Processing user: Alice"
     * // Console: "User processed: true"
     * // Result<{ name: string; age: number; isAdult: boolean }, never>
     * ```
     */
    (fn: (v: FlowValue<O>) => void): Flow<I, O, E, A>;
    (fn: (v: FlowValue<O>) => Promise<void>): Flow<I, O, E, 'async'>;
  };

  ifThen: {
    /**
     * Conditionally executes a function based on a predicate.
     * Only executes the function if the predicate returns true.
     * Only applied if the flow result is a success. Errors are preserved unchanged.
     * If the predicate is false, the original value is preserved.
     *
     * @param fn - An object containing the predicate (`if`) and the function to execute (`then`).
     * @returns A new Flow with the conditional execution applied.
     *
     * @example
     * ```ts
     * const fl = flow<{ value: number }>()
     *   .ifThen({
     *     if: (data) => data.value > 10,
     *     then: (data) => ok({ ...data, status: 'high' })
     *   })
     *   .ifThen({
     *     if: (data) => data.value < 0,
     *     then: (data) => err('NEGATIVE_VALUE')
     *   })
     *   .build();
     *
     * // Predicate true - transformation applied
     * const highResult = fl({ value: 15 });
     * // Result<{ value: number; status: string }, "NEGATIVE_VALUE">
     *
     * // Predicate false - original value preserved
     * const lowResult = fl({ value: 5 });
     * // Result<{ value: number }, "NEGATIVE_VALUE">
     * ```
     */
    <B, F>(fn: {
      if: (v: FlowValue<O>) => boolean;
      then: (v: FlowValue<O>) => Result<B, F>;
    }): Flow<I, O | B, E | F, A>;
    <B, F>(fn: {
      if: (v: FlowValue<O>) => boolean;
      then: (v: FlowValue<O>) => Promise<Result<B, F>>;
    }): Flow<I, O | B, E | F, 'async'>;
  };

  ifThenElse: {
    /**
     * Conditionally executes one of two functions based on a predicate.
     * Always executes either the `then` or `else` function.
     * Only applied if the flow result is a success. Errors are preserved unchanged.
     *
     * @param fn - An object containing the predicate (`if`), success function (`then`),
     * and fallback function (`else`).
     * @returns A new Flow with the conditional execution applied.
     *
     * @example
     * ```ts
     * const fl = flow<{ value: number }>()
     *   .ifThenElse({
     *     if: (data) => data.value > 20,
     *     then: (data) => ok({ ...data, priority: 'critical' }),
     *     else: (data) => ok({ ...data, priority: 'normal' })
     *   })
     *   .ifThenElse({
     *     if: (data) => data.value < 0,
     *     then: (data) => err('NEGATIVE_VALUE'),
     *     else: (data) => ok(data)
     *   })
     *   .build();
     *
     * // High value - critical priority
     * const highResult = fl({ value: 25 });
     * // Result<{ value: number; priority: string }, "NEGATIVE_VALUE">
     *
     * // Low value - normal priority
     * const lowResult = fl({ value: 15 });
     * // Result<{ value: number; priority: string }, "NEGATIVE_VALUE">
     * ```
     */
    <B, C, F>(fn: {
      if: (v: FlowValue<O>) => boolean;
      then: (v: FlowValue<O>) => Result<B, F>;
      else: (v: FlowValue<O>) => Result<C, F>;
    }): Flow<I, B | C, E | F, A>;
    <B, C, F>(fn: {
      if: (v: FlowValue<O>) => boolean;
      then: (v: FlowValue<O>) => Promise<Result<B, F>>;
      else: (v: FlowValue<O>) => Promise<Result<C, F>>;
    }): Flow<I, B | C, E | F, 'async'>;
    <B, C, F>(fn: {
      if: (v: FlowValue<O>) => boolean;
      then: (v: FlowValue<O>) => Promise<Result<B, F>>;
      else: (v: FlowValue<O>) => Result<C, F>;
    }): Flow<I, B | C, E | F, 'async'>;
    <B, C, F>(fn: {
      if: (v: FlowValue<O>) => boolean;
      then: (v: FlowValue<O>) => Result<B, F>;
      else: (v: FlowValue<O>) => Promise<Result<C, F>>;
    }): Flow<I, B | C, E | F, 'async'>;
  };

  bind: {
    /**
     * Binds a new property to the input object.
     * The function receives the current object and returns a Result with the value for the
     * new property.
     * Only applied if the flow result is a success. Errors are preserved unchanged.
     *
     * For primitive values or arrays, creates a new object with the bound property.
     * For objects, merges the new property into the existing object.
     *
     * @param key - The key for the new property.
     * @param fn - The function that computes the value for the new property.
     * @returns A new Flow with the bound property added to the input object.
     *
     * @example
     * ```ts
     * const fl = flow<{ name: string; age: number }>()
     *   .bind('isAdult', (user) => ok(user.age >= 18))
     *   .bind('greeting', (user) => ok(`Hello ${user.name}!`))
     *   .bind('status', (user) => {
     *     if (user.age < 13) return ok('child');
     *     if (user.age < 18) return ok('teenager');
     *     return ok('adult');
     *   })
     *   .build();
     *
     * const result = fl({ name: 'Alice', age: 25 });
     * // Result<{
     * //   name: string;
     * //   age: number;
     * //   isAdult: boolean;
     * //   greeting: string;
     * //   status: string;
     * // }, never>
     *
     * // For primitive values
     * const primitiveFlow = flow<number>()
     *   .bind('doubled', (n) => ok(n * 2))
     *   .build();
     *
     * const primitiveResult = primitiveFlow(5);
     * // Result<{ doubled: number }, never>
     * ```
     */
    <K extends string, V, F>(
      key: K,
      fn: (v: FlowValue<O>) => Result<V, F>,
    ): Flow<I, Bind<FlowValue<O>, K, V>, E | F, A>;
    <K extends string, V, F>(
      key: K,
      fn: (v: FlowValue<O>) => Promise<Result<V, F>>,
    ): Flow<I, Bind<FlowValue<O>, K, V>, E | F, 'async'>;
  };

  /**
   * Builds the flow in a type-safe way, automatically inferring the flow input and output types.
   * Handles both sync and async steps. The returned function will be async if any step in the flow
   * is async.
   *
   * @returns A function that processes the flow with the correct input and output types.
   *
   * @example
   * ```ts
   * // Sync flow
   * const syncFlow = flow<{ a: number; b: number }>()
   *   .map(({ a, b }) => ok(a + b))
   *   .build();
   *
   * const result = syncFlow({ a: 5, b: 3 }); // Result<number, never>
   *
   * // Async flow
   * const asyncFlow = flow<{ name: string }>()
   *   .bind('greeting', async (user) => ok(`Hello ${user.name}!`))
   *   .build();
   *
   * const asyncResult = await asyncFlow({ name: 'Alice' });
   * // Result<{ name: string; greeting: string }, never>
   * ```
   */
  build: A extends 'async'
    ? () => (v: I) => Promise<Result<MergeUnion<O>, E>>
    : () => (v: I) => Result<MergeUnion<O>, E>;

  /**
   * Returns the steps of the flow for debugging, tracing, or introspection purposes.
   * Each step contains information about its type, operator, and function.
   *
   * @returns An array of flow steps with metadata.
   *
   * @example
   * ```ts
   * const fl = flow<{ name: string }>()
   *   .bind('greeting', (user) => ok(`Hello ${user.name}!`))
   *   .tap((user) => console.log(user))
   *   .map((user) => ok({ ...user, processed: true }));
   *
   * const steps = fl.steps();
   * // [
   * //   { _tag: 'Step', kind: 'sync', operator: 'bind', mapping: 'success', ... },
   * //   { _tag: 'Step', kind: 'sync', operator: 'tap', mapping: 'success', ... },
   * //   { _tag: 'Step', kind: 'sync', operator: 'map', mapping: 'success', ... }
   * // ]
   * ```
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
  success: (v: Any, step: FlowStep) => {
    if (!isOk(v)) return v;

    return step.operator === 'map'
      ? step.fn(v.value)
      : operators[step.operator as Exclude<FlowOperator, 'map' | 'mapErr' | 'mapBoth'>](v, step.fn);
  },

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
  (steps: FlowStep[], operator: FlowOperator, mapping: FlowMapping, api: Any) =>
  (fn: FlowFunction) => {
    steps.push({
      _tag: 'Step',
      kind: fn.constructor.name === 'AsyncFunction' ? 'async' : 'sync',
      fn,
      hash: fn.toString(),
      operator,
      mapping,
    } satisfies FlowStep);

    return api;
  };

/**
 * Creates a new Result flow.
 * This flow supports both sync and async steps with explicit build methods.
 *
 * ## Error Handling
 *
 * The flow automatically handles error propagation:
 * - **Success steps**: Only execute if the previous step was successful.
 * - **Error steps**: Only execute if the previous step failed.
 * - **Error preservation**: Once an error occurs, subsequent success steps are skipped.
 * - **Error transformation**: Use `mapErr` to transform errors or `mapBoth` to handle both cases.
 *
 * ## Async Behavior
 *
 * - Mix sync and async operations seamlessly.
 * - The flow automatically becomes async if any step is async.
 * - Async flows return `Promise<Result<T, E>>` instead of `Result<T, E>`.
 *
 * ## Type Safety
 *
 * - Full TypeScript support with automatic type inference.
 * - Error types are automatically joined across all steps.
 * - Output types are correctly inferred based on transformations.
 *
 * @typeParam I - The type of the input value.
 * @returns A new Flow.
 *
 * @example
 * ```ts
 * // Basic sync flow with map
 * const syncFlow = flow<{ a: number; b: number }>()
 *   .map(({ a, b }) => ok(a + b))
 *   .build();
 *
 * const result = syncFlow({ a: 10, b: 2 }); // Result<number, never>
 *
 * // Async flow with bind
 * const asyncFlow = flow<{ name: string; age: number }>()
 *   .bind('isAdult', async (user) => ok(user.age >= 18))
 *   .bind('greeting', async (user) => ok(`Hello ${user.name}!`))
 *   .map((user) => ok({ ...user, processed: true }))
 *   .build();
 *
 * const asyncResult = await asyncFlow({ name: 'Alice', age: 25 });
 * // Result<{ name: string; age: number; isAdult: boolean; greeting: string; processed: boolean }, never>
 *
 * // Flow with conditional logic
 * const conditionalFlow = flow<{ value: number }>()
 *   .ifThen({
 *     if: (data) => data.value > 10,
 *     then: (data) => ok({ ...data, status: 'high' })
 *   })
 *   .ifThenElse({
 *     if: (data) => data.value > 20,
 *     then: (data) => ok({ ...data, priority: 'critical' }),
 *     else: (data) => ok({ ...data, priority: 'normal' })
 *   })
 *   .build();
 *
 * // Flow with error handling
 * const errorHandlingFlow = flow<{ id: string }>()
 *   .map((data) => data.id === 'invalid' ? err('INVALID_ID') : ok(data))
 *   .mapErr((error) => ok({ error, timestamp: Date.now() }))
 *   .build();
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

  // Operators.
  api.map = flowFunction(steps, 'map', 'success', api);
  api.mapErr = flowFunction(steps, 'mapErr', 'error', api);
  api.mapBoth = flowFunction(steps, 'mapBoth', 'both', api);
  api.tap = flowFunction(steps, 'tap', 'success', api);
  api.ifThen = flowFunction(steps, 'ifThen', 'success', api);
  api.ifThenElse = flowFunction(steps, 'ifThenElse', 'success', api);
  api.bind = (key: string, fn: FlowFunction) =>
    flowFunction(steps, 'bind', 'success', api)(Object.assign(fn, { key }));

  return api;
}

// *********************************************************************************************
// Flow operators.
// *********************************************************************************************

/**
 * Checks if the value is bindable.
 * Bindable values are spreadable objects.
 *
 * @param v - The value to check.
 * @returns True if the value is bindable, false otherwise.
 *
 * @internal
 */
const isBindable = (v: Any) => typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * A tap is a side-effect function that does not change the flow result.
 * It is useful for logging, debugging, tracing, etc.
 * Only is applied if the flow result is a success.
 *
 * @param v - The value to process.
 * @param fn - The function to apply to the flow.
 * @returns The processed value.
 *
 * @internal
 */
const tap = (v: Any, fn: Any) => (fn(v.value), v);

/**
 * Conditionally executes a function based on a predicate.
 * Only executes the function if the predicate returns true.
 * Only applied if the flow result is a success.
 *
 * @param v - The value to process.
 * @param fn - The function to apply to the flow.
 * @returns The processed value.
 *
 * @internal
 */
const ifThen = (v: Any, fn: Any) => (fn.if(v.value) ? fn.then(v.value) : v);

/**
 * Conditionally executes a function based on a predicate.
 * Only executes the function if the predicate returns true.
 * Only applied if the flow result is a success.
 *
 * @param v - The value to process.
 * @param fn - The function to apply to the flow.
 * @returns The processed value.
 *
 * @internal
 */
const ifThenElse = (v: Any, fn: Any) => (fn.if(v.value) ? fn.then(v.value) : fn.else(v.value));

/**
 * Binds a new property to the input object.
 * The function receives the current object and returns a Result with the value for the new property.
 * Only applied if the flow result is a success.
 *
 * @param v - The value to bind.
 * @param fn - The function that computes the value for the new property.
 * @returns A new Flow with the bound property added to the input object.
 *
 * @internal
 */
function bind(v: Any, fn: Any) {
  const result = fn(v.value);

  if (result instanceof Promise) {
    return result.then((r) =>
      isOk(r) ? ok({ ...(isBindable(v.value) ? { ...v.value } : {}), [fn.key]: r.value }) : r,
    );
  }

  return isOk(result)
    ? ok({ ...(isBindable(v.value) ? { ...v.value } : {}), [fn.key]: result.value })
    : result;
}

/**
 * Operators that handle different flow behaviors.
 * Each operator processes the flow result according to its specific logic.
 *
 * @internal
 */
const operators: Record<
  Exclude<FlowOperator, 'map' | 'mapErr' | 'mapBoth'>,
  (v: Any, fn: FlowFunction) => Any
> = {
  tap,
  ifThen,
  ifThenElse,
  bind,
};

export type { Flow };
export { flow };
