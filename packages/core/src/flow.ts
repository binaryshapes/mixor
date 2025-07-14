/*
 * This file is part of the Daikit project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { Any, MergeUnion, Prettify, PrimitiveTypeExtended } from './generics';
import { hash } from './hash';
import { type Result, isErr, isOk, ok, unwrap } from './result';

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
  _hash: string;
  kind: 'sync' | 'async';
  fn: FlowFunction;
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
      _hash: hash(fn),
      kind: fn.constructor.name === 'AsyncFunction' ? 'async' : 'sync',
      fn,
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
 *   .bind('greeting', async (user) => ok(`Hello ${user.name}!`))
 *   .bind('status', async (user) => ok(user.age >= 18 ? 'adult' : 'minor'))
 *   .map((user) => ok({ ...user, processed: true }))
 *   .build();
 *
 * const asyncResult = await asyncFlow({ name: 'Alice', age: 25 });
 * // Result<{ name: string; age: number; greeting: string; status: string; processed: boolean }, never>
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
 *
 * // Parallel execution of multiple flows
 * const parallelFlow = flow.parallel(
 *   flow<{ name: string }>().map((user) => ok(user.name.toUpperCase())),
 *   flow<{ age: number }>().map((user) => ok(user.age * 2)),
 *   flow<{ city: string }>().map((user) => ok(user.city.toLowerCase()))
 * );
 *
 * const parallelResult = await parallelFlow([
 *   { name: 'Alice' },
 *   { age: 25 },
 *   { city: 'New York' }
 * ]);
 * // [Result<string, never>, Result<number, never>, Result<string, never>]
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

// *********************************************************************************************
// Flow constructors.
// *********************************************************************************************

/**
 * Flow array type.
 *
 * @internal
 */
type FlowArray = readonly Flow<Any, Any, Any, Any>[];

/**
 * Check if any flow in a tuple is async.
 *
 * @internal
 */
type HasAsyncFlow<T extends FlowArray> = T extends readonly [infer First, ...infer Rest]
  ? First extends Flow<Any, Any, Any, infer A>
    ? A extends 'async'
      ? true
      : Rest extends readonly Flow<Any, Any, Any, Any>[]
        ? HasAsyncFlow<Rest>
        : false
    : Rest extends readonly Flow<Any, Any, Any, Any>[]
      ? HasAsyncFlow<Rest>
      : false
  : false;

/**
 * Extract the input type from the first flow in a sequence.
 *
 * @internal
 */
type SequentialInput<T extends FlowArray> = T extends readonly [infer First, ...Any]
  ? First extends Flow<infer I, Any, Any, Any>
    ? I
    : never
  : never;

/**
 * Extract the output type from the last flow in a sequence.
 *
 * @internal
 */
type SequentialOutput<T extends FlowArray> = T extends readonly [...Any, infer Last]
  ? Last extends Flow<Any, infer O, Any, Any>
    ? O
    : never
  : never;

/**
 * Extract all error types from a sequence of flows.
 *
 * @internal
 */
type SequentialErrors<T extends FlowArray> = T extends readonly [infer First, ...infer Rest]
  ? First extends Flow<Any, Any, infer E, Any>
    ? Rest extends readonly Flow<Any, Any, Any, Any>[]
      ? E | SequentialErrors<Rest>
      : E
    : Rest extends readonly Flow<Any, Any, Any, Any>[]
      ? SequentialErrors<Rest>
      : never
  : never;

/**
 * Sequential flow type that chains flows together.
 * Each flow receives the output of the previous flow as input.
 *
 * @internal
 */
type SequentialFlow<T extends FlowArray> = (
  input: SequentialInput<T>,
) => HasAsyncFlow<T> extends true
  ? Promise<Result<SequentialOutput<T>, SequentialErrors<T>>>
  : Result<SequentialOutput<T>, SequentialErrors<T>>;

/**
 * Parallel flow type.
 *
 * @internal
 */
type ParallelFlow<T extends FlowArray> = (inputs: {
  [K in keyof T]: T[K] extends Flow<infer I, Any, Any, Any> ? I : never;
}) => HasAsyncFlow<T> extends true
  ? Promise<{
      [K in keyof T]: T[K] extends Flow<Any, infer O, infer E, Any> ? Result<O, E> : never;
    }>
  : {
      [K in keyof T]: T[K] extends Flow<Any, infer O, infer E, Any> ? Result<O, E> : never;
    };

/**
 * Executes multiple flows in sequence.
 * Each flow receives the output of the previous flow as input.
 * Returns the result of the last flow in the sequence.
 *
 * ## Behavior
 *
 * - **Sequential execution**: Flows execute one after another, waiting for each to complete.
 * - **Data flow**: Each flow receives the output of the previous flow as its input.
 * - **Error propagation**: If any flow fails, the error is propagated and subsequent flows are skipped.
 * - **Async handling**: If any flow is async, the entire operation becomes async and returns a Promise.
 * - **Type safety**: Ensures that each flow's output type matches the next flow's input type.
 *
 * ## Type Safety
 *
 * - Validates that each flow's output type matches the next flow's input type.
 * - Combines error types from all flows in the sequence.
 * - Preserves the output type of the last flow in the sequence.
 * - Handles both sync and async flows seamlessly.
 * - Automatically infers Promise return type when any flow is async.
 *
 * ## Use Cases
 *
 * - **Data transformation pipelines**: Transform data through multiple stages.
 * - **Validation chains**: Validate data through multiple validation steps.
 * - **API processing**: Process data through multiple API calls in sequence.
 * - **File processing**: Read, transform, and write files in sequence.
 *
 * @typeParam Flows - Tuple of flows to execute in sequence.
 * @param flows - Array of flows to execute in sequence.
 * @returns A new Flow that executes all flows in sequence.
 *
 * @example
 * ```ts
 * // Sequential execution of sync flows
 * const sequentialFlow = flow.sequential(
 *   flow<{ name: string; age: number }>()
 *     .map((user) => ok({ ...user, isAdult: user.age >= 18 })),
 *   flow<{ name: string; age: number; isAdult: boolean }>()
 *     .bind('greeting', (user) => ok(`Hello ${user.name}!`)),
 *   flow<{ name: string; age: number; isAdult: boolean; greeting: string }>()
 *     .map((user) => ok({ ...user, processed: true }))
 * );
 *
 * const result = sequentialFlow({ name: 'Alice', age: 25 });
 * // Result<{ name: string; age: number; isAdult: boolean; greeting: string; processed: boolean }, never>
 * // Result: ok({ name: 'Alice', age: 25, isAdult: true, greeting: 'Hello Alice!', processed: true })
 *
 * // Sequential execution with async flows
 * const asyncSequentialFlow = flow.sequential(
 *   flow<{ id: string }>()
 *     .map(async (user) => {
 *       await sleep(10);
 *       return ok({ ...user, fetched: true });
 *     }),
 *   flow<{ id: string; fetched: boolean }>()
 *     .bind('processed', async (user) => {
 *       await sleep(10);
 *       return ok(`processed_${user.id}`);
 *     })
 * );
 *
 * const asyncResult = await asyncSequentialFlow({ id: '123' });
 * // Result<{ id: string; fetched: boolean; processed: string }, never>
 *
 * // Mixed sync and async flows
 * const mixedFlow = flow.sequential(
 *   flow<{ value: number }>()
 *     .map((data) => ok(data.value * 2)),
 *   flow<number>()
 *     .map(async (value) => {
 *       await sleep(10);
 *       return ok(value + 1);
 *     }),
 *   flow<number>()
 *     .map((value) => ok(value.toString()))
 * );
 *
 * const mixedResult = await mixedFlow({ value: 5 });
 * // Result<string, never>
 * // Result: ok('11')
 *
 * // Error handling in sequential flows
 * const errorFlow = flow.sequential(
 *   flow<{ value: number }>()
 *     .map((data) => data.value > 0 ? ok(data.value) : err('NEGATIVE_VALUE')),
 *   flow<number>()
 *     .map((value) => value > 10 ? ok(value) : err('TOO_SMALL')),
 *   flow<number>()
 *     .map((value) => ok(value * 2))
 * );
 *
 * // Success case
 * const successResult = errorFlow({ value: 15 });
 * // Result<number, "NEGATIVE_VALUE" | "TOO_SMALL">
 * // Result: ok(30)
 *
 * // Error case - stops at first error
 * const errorResult = errorFlow({ value: -5 });
 * // Result<never, "NEGATIVE_VALUE" | "TOO_SMALL">
 * // Result: err('NEGATIVE_VALUE')
 * ```
 *
 * @public
 */
flow.sequential = <T extends FlowArray>(...flows: T): SequentialFlow<T> => {
  if (flows.length === 0) {
    throw new Error('flow.sequential requires at least one flow');
  }

  // Build all flows
  const builtFlows = flows.map((flow) => flow.build());
  const isAsync = flows.some((flow) => flow.steps().some((step) => step.kind === 'async'));

  if (isAsync) {
    return (async (input: Any) => {
      let currentResult = await builtFlows[0](input);

      for (let i = 1; i < builtFlows.length; i++) {
        if (isErr(currentResult)) {
          return currentResult;
        }
        const unwrappedValue = unwrap(currentResult);
        const nextResult = await builtFlows[i](unwrappedValue);
        currentResult = nextResult;
      }

      return currentResult;
    }) as SequentialFlow<T>;
  } else {
    return ((input: Any) => {
      let currentResult = builtFlows[0](input) as Any;

      for (let i = 1; i < builtFlows.length; i++) {
        if (isErr(currentResult)) {
          return currentResult;
        }
        const unwrappedValue = unwrap(currentResult);
        const nextResult = builtFlows[i](unwrappedValue);
        currentResult = nextResult;
      }

      return currentResult;
    }) as SequentialFlow<T>;
  }
};

/**
 * Executes multiple flows in parallel.
 * Each flow receives its own input and executes independently.
 * Returns an array of Results, one for each flow.
 *
 * ## Behavior
 *
 * - **Parallel execution**: All flows execute simultaneously, not waiting for each other.
 * - **Independent inputs**: Each flow receives its own input value from the input array.
 * - **Array output**: Returns an array of Results, maintaining the order of input flows.
 * - **Async handling**: If any flow is async, the entire operation becomes async and returns a Promise.
 * - **Error isolation**: Each flow's errors are contained within its own Result, not affecting other flows.
 *
 * ## Type Safety
 *
 * - Preserves the exact types of each flow's output and error types.
 * - Returns a tuple type matching the input flows' types.
 * - Handles both sync and async flows seamlessly.
 * - Automatically infers Promise return type when any flow is async.
 *
 * ## Use Cases
 *
 * - **Data validation**: Validate multiple fields independently.
 * - **API calls**: Make multiple API requests simultaneously.
 * - **File operations**: Read/write multiple files in parallel.
 * - **Database queries**: Execute multiple queries concurrently.
 *
 * @typeParam Flows - Tuple of flows to execute in parallel.
 * @param flows - Array of flows to execute in parallel.
 * @returns A function that takes an array of inputs and returns an array of Results.
 *
 * @example
 * ```ts
 * // Parallel execution of sync flows
 * const parallelFlow = flow.parallel(
 *   flow<{ name: string }>().map((user) => ok(user.name.toUpperCase())),
 *   flow<{ age: number }>().map((user) => ok(user.age * 2)),
 *   flow<{ city: string }>().map((user) => ok(user.city.toLowerCase()))
 * );
 *
 * const result = parallelFlow([
 *   { name: 'Alice' },
 *   { age: 25 },
 *   { city: 'New York' }
 * ]);
 * // [Result<string, never>, Result<number, never>, Result<string, never>]
 * // Result: [ok('ALICE'), ok(50), ok('new york')]
 *
 * // Parallel execution with async flows
 * const asyncParallelFlow = flow.parallel(
 *   flow<{ id: string }>().map(async (user) => {
 *     await sleep(10);
 *     return ok(`user_${user.id}`);
 *   }),
 *   flow<{ email: string }>().map(async (user) => {
 *     await sleep(10);
 *     return ok(user.email.toUpperCase());
 *   })
 * );
 *
 * const asyncResult = await asyncParallelFlow([
 *   { id: '123' },
 *   { email: 'test@example.com' }
 * ]);
 * // [Result<string, never>, Result<string, never>]
 *
 * // Mixed sync and async flows
 * const mixedFlow = flow.parallel(
 *   flow<{ name: string }>().map((user) => ok(user.name.length)),
 *   flow<{ id: string }>().map(async (user) => {
 *     await sleep(10);
 *     return ok(`id_${user.id}`);
 *   })
 * );
 *
 * const mixedResult = await mixedFlow([
 *   { name: 'Alice' },
 *   { id: '123' }
 * ]);
 * // Promise<[Result<number, never>, Result<string, never>]>
 *
 * // Error handling in parallel flows
 * const errorFlow = flow.parallel(
 *   flow<{ value: number }>().map((data) => data.value > 0 ? ok(data.value) : err('NEGATIVE')),
 *   flow<{ name: string }>().map((data) => data.name.length > 0 ? ok(data.name) : err('EMPTY_NAME'))
 * );
 *
 * const errorResult = errorFlow([
 *   { value: -5 },
 *   { name: '' }
 * ]);
 * // [Result<number, "NEGATIVE">, Result<string, "EMPTY_NAME">]
 * // Result: [err('NEGATIVE'), err('EMPTY_NAME')]
 * ```
 *
 * @public
 */
flow.parallel = <T extends FlowArray>(...flows: T) =>
  ((inputs: FlowArray) => {
    const results = flows.map((flow, index) => flow.build()(inputs[index]));
    return flows.some((flow) => flow.steps().some((step) => step.kind === 'async'))
      ? Promise.all(results)
      : results;
  }) as ParallelFlow<T>;

export type { Flow };
export { flow };
