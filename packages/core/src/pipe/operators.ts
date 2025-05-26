/*
 * This file is part of the Daikit project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { PrimitiveTypeExtended } from '../utils';
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

export { map, bind, tap };
