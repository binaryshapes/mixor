/*
 * This file is part of the Daikit project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { NonFunction, PrimitiveTypeExtended } from '../utils';
import { type PipeFn, pipeOperator } from './pipe';

/**
 * A map operator takes the input value of type A and applies a function to it, returning the
 * result of type B. Note the returned value can be of type A or B, depending on the function.
 *
 * @example
 * ```ts
 * // Keep the type of the input value.
 * const pipeline = pipe<number>("Double value with map")
 *  .step('Double', map((n) => n * 2))
 *  .build()
 *
 * const result = pipeline(2) // result: 4 (number)
 *
 * // Change the type of the input value.
 * const pipeline2 = pipe<number>("Transform the value to string")
 *  .step('Transform', map((n) => n.toString()))
 *  .build()
 *
 * const result2 = pipeline2(2) // result: '2' (string)
 * ```
 *
 * @public
 */
const map = pipeOperator(
  'map',
  <A, B>(fn: PipeFn<A, B>) =>
    (a: A) =>
      fn(a),
);

/**
 * A tap operator allows executing side effects without changing the input value.
 * The function is called with the input value, but the operator always returns the original
 * input value unchanged.
 *
 * @example
 * ```ts
 * const pipeline = pipe<number>("Log value with tap")
 * .step('Log value', tap((n) => Logger.info('Current value:', n)))
 *
 * // The tap function can also be async.
 * const pipeline2 = pipe<number>("Log value with tap")
 *  .step('Log value', tap(async (n) => Logger.info('Current value:', n)))
 *  .build()
 *
 * const result2 = pipeline2(2) // result: 2 (number)
 * ```
 *
 * @public
 */
const tap = pipeOperator('tap', <A>(fn: PipeFn<A, void>) => (a: A) => {
  fn(a);
  return a;
});

/**
 * A bind operator merges the result of the applied function with the previous value.
 * If the previous value is not an object, it will be removed.
 *
 * @example
 * ```ts
 * // With object input.
 * const pipeline = pipe<{ value: number }>("Double with factor")
 *  .step('Double value', map((n) => ({ ...n, value: n.value * 2 })))
 *  .step('Add factor', bind('factor', (n) => n.value * 2))
 *  .build()
 *
 * const result = pipeline({ value: 2 }) // result: { value: 4, factor: 8 }
 *
 * // With primitive input.
 * const pipeline2 = pipe<number>("Double with factor")
 *  .step('Double value', map((n) => n * 2))
 *  .step('Add factor', bind('factor', (n) => n * 2))
 *  .build()
 *
 * const result2 = pipeline2(2) // result: { factor: 8 }
 *
 * // With array input.
 * const pipeline3 = pipe<Array<number>>("Double with factor")
 *  .step('Double value', map((n) => n * 2))
 *  .step('Add factor', bind('factor', (n) => n * 2))
 *  .build()
 *
 * const result3 = pipeline3([1, 2, 3]) // result: { factor: 8 }
 * ```
 *
 * @public
 */
const bind = pipeOperator(
  'bind',
  <A, B, K extends string>(key: K, fn: PipeFn<A, B>) =>
    (a: A) =>
      ({
        // We spread the input value only if it is an object and not an array.
        ...(typeof a === 'object' && !Array.isArray(a) ? a : {}),
        [key]: fn(a),
      }) as (A extends PrimitiveTypeExtended ? unknown : A) & { [P in K]: B },
);

/**
 * A conditional operator that executes a function only if a condition is met.
 * If the condition is false, it returns undefined.
 *
 * Notes:
 * - The condition function must return a boolean.
 * - The then function is only executed if the condition is true.
 * - Returns undefined if the condition is false.
 *
 * ```text
 * Conditional execution diagram:
 *
 *               ┌─────────────┐       ┌─────────────┐
 *   Input  ──▶  │ Condition   │ ────▶ |    Then     | ──▶ Then function result (if true)
 *               └─────────────┘   |   └─────────────┘
 *                                 └────▶ undefined (if false)
 *
 * Example with values:
 *
 *               ┌─────────────┐       ┌─────────────┐
 *       n=5 ──▶ │ n > 3: true │ ────▶ |    n*2      | ──▶ 10
 *               └─────────────┘       └─────────────┘
 *
 *               ┌─────────────┐
 *       n=2 ──▶ │ n > 3: false│ ────▶ Undefined
 *               └─────────────┘
 * ```
 *
 * @param fn - A function that takes the input and returns an object with the condition and
 * the then function if condition is true.
 * @returns A function that takes a value of type A and returns either a value of type B or undefined.
 *
 * @example
 * ```ts
 * const pipeline = pipe<number>("Double if greater than 3")
 *   .step('Conditional double', ifThen(
 *     (n) => ({
 *       if: n > 3,
 *       then: n * 2,
 *     })
 *   ))
 *   .build()
 *
 * const result1 = pipeline(5) // result: 10
 * const result2 = pipeline(2) // result: undefined
 * ```
 *
 * @public
 */
const ifThen = pipeOperator(
  'ifThen',
  <A, B>(
    fn: (a: A) => {
      if: boolean;
      then: NonFunction<B>;
    },
  ) =>
    (a: A) => {
      const { if: condition, then } = fn(a);
      return condition ? then : undefined;
    },
);

/**
 * A conditional operator that executes one of two functions based on a condition.
 * If the condition is true, it executes the 'then' function, otherwise it executes the 'else'
 * function.
 *
 * Notes:
 * - The condition function must return a boolean.
 * - The then function is executed if the condition is true.
 * - The else function is executed if the condition is false.
 * - Both functions must return the same type.
 *
 * ```text
 * Conditional execution diagram:
 *
 *                   (true)         ┌──────────────┐
 *                     ┌──────────-▶│    Then      │ ─────┐
 *                     │            └──────────────┘      │
 *                ┌────────────┐                          │
 *    Input ───▶  │ Condition  │                          ├──▶ Result (from then or else)
 *                └────────────┘                          │
 *                     │            ┌──────────────┐      │
 *                     └─-─────────▶│    Else      │ ─────┘
 *                  (false)         └──────────────┘
 *
 *
 * Example with values:
 *
 *                   (true)         ┌──────────────┐
 *                     ┌──────────-▶│   100 / 2    │ ─────┐
 *                     │            └──────────────┘      │
 *                 ┌────────────┐                         │
 *  [100, 2] ───▶  │   2 > 0    │                         ├──▶ 50
 *                 └────────────┘                         │
 *                     │            ┌──────────────┐      │
 *                     └─-─────────▶│    Error     │ ─────┘
 *                  (false)         └──────────────┘
 *
 *
 *                   (false)        ┌──────────────┐
 *                     ┌──────────-▶│    100 / 0   │ ─────┐
 *                     │            └──────────────┘      │
 *                 ┌────────────┐                         │
 *  [100, 0] ───▶  │   0 > 0    │                         ├──▶ Error
 *                 └────────────┘                         │
 *                     │            ┌──────────────┐      │
 *                     └─-─────────▶│    Error     │ ─────┘
 *                  (false)         └──────────────┘
 *
 * ```
 *
 * @param condition - A function that takes the input value and returns a boolean.
 * @param then - A function that takes the input value and returns a value of type B.
 * @param elseFn - A function that takes the input value and returns a value of type B.
 * @returns A function that takes a value of type A and returns a value of type B.
 *
 * @example
 * ```ts
 * const pipeline = pipe<[number, number]>('Division')
 *   .step(
 *     'Divide two numbers or throw error',
 *     ifThenElse(
 *       ([a, b]: [number, number]) => ({
 *         if: b !== 0,
 *         then: a / b,
 *         else: () => {
 *           throw new Error(`Cannot execute division by zero for this input: ${a}/${b}`);
 *         },
 *       }),
 *     ),
 *   )
 *   .build();
 *
 * const result = pipeline([100, 0]) // Error: Cannot execute division by zero for this input: 100/0
 * const result2 = pipeline([100, 2]) // result: 50
 * ```
 * @public
 */
const ifThenElse = pipeOperator(
  'ifThenElse',
  <A, B, C>(
    fn: (a: A) => {
      if: boolean;
      then: NonFunction<B>;
      else: NonFunction<C>;
    },
  ) =>
    (a: A) => {
      const { if: condition, then, else: elseFn } = fn(a);
      return (condition ? then : elseFn) as B extends C ? B : B | C;
    },
);

export { map, bind, tap, ifThen, ifThenElse };
