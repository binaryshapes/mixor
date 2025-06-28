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

// TODO: Add to Flow type async type parameter.
// TODO: Store steps metadata to the flow.
// TODO: Infer the flow input from the first step (support for primitives, arrays and objects).
// TODO: Implement flow operators (mapErr, mapBoth, tap, bind, ifThen, ifThenElse, etc).

/**
 * Panic error for the flow module.
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
 * Type-safe Result flow with correct type inference for each step.
 * Supports both sync and async steps, with explicit build methods.
 *
 * @typeParam I - The type of the input value.
 * @typeParam O - The type of the output value.
 * @typeParam E - The union of all error types.
 *
 * @public
 */
type Flow<I, O, E> = {
  /**
   * Adds a new step to the flow.
   * The step can be either sync or async.
   *
   * @param fn - The function to apply to the flow.
   * @returns A new Flow with the step added.
   */
  step: <B, F extends string>(
    fn: (a: O) => Result<B, F> | Promise<Result<B, F>>,
  ) => Flow<I, B, E | F>;

  /**
   * Builds a sync flow.
   * Throws an error if any step is async.
   *
   * @returns A sync function that processes the flow.
   * @throws A {@link FlowError} if any step is async.
   */
  build: () => (input: I) => Result<O, E>;

  /**
   * Builds an async flow.
   * Supports both sync and async steps.
   *
   * @returns An async function that processes the flow.
   * @throws A {@link FlowError} if no async steps are found.
   */
  buildAsync: () => (input: I) => Promise<Result<O, E>>;
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
  /**
   * @param steps - The steps of the flow.
   * @returns A new Flow.
   *
   * @internal
   */
  const make = <O, E>(
    steps: Array<(a: Any) => Result<Any, Any> | Promise<Result<Any, Any>>>,
  ): Flow<I, O, E> => {
    return {
      step: <B, F extends string>(fn: (a: O) => Result<B, F> | Promise<Result<B, F>>) =>
        make<B, E | F>([...steps, fn]),
      build: () => (input: I) => {
        let result: Result<Any, Any> = ok(input);
        for (const fn of steps) {
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
        return result as Result<O, E>;
      },
      buildAsync: () => async (input: I) => {
        let asyncStepsCount = 0;
        let result: Result<Any, Any> = ok(input);

        for (const fn of steps) {
          if (isOk(result)) {
            const nextResult = fn(result.value);
            if (nextResult instanceof Promise) {
              asyncStepsCount++;
              result = await nextResult;
            } else {
              result = nextResult;
            }
          }
        }

        if (asyncStepsCount === 0) {
          throw new FlowError(
            'NO_ASYNC_STEPS_IN_ASYNC_FLOW',
            'No async steps found in flow. Use build instead.',
          );
        }

        return result as Result<O, E>;
      },
    };
  };
  return make<I, never>([]);
}

export type { Flow };
export { flow };
