/*
 * This file is part of the Daikit project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { type Any, type Prettify, toCamelCase } from '../utils';
import { type PipeFn, withPipeMetadata } from './pipe';

// *********************************************************************************************
// Internal functions.
// *********************************************************************************************

/**
 * Creates a metadata object for an operator.
 *
 * @param fn - The function to create metadata for.
 * @param operator - The operator name.
 * @returns A metadata object.
 *
 * @internal
 */
function operatorMetadata(fn: PipeFn<Any, Any>, operator: string) {
  return {
    name: fn.name || toCamelCase(`anonymous_${operator}_${typeof fn}`),
    operator,
    isAsync: fn.constructor.name === 'AsyncFunction',
  };
}

// *********************************************************************************************
// Operators types.
// *********************************************************************************************

/**
 * Map operator type.
 *
 * @typeParam A - The type of the input value.
 * @typeParam B - The type of the output value.
 * @param f - The function to apply to the value.
 * @returns A map operator that can be used in a pipeline.
 *
 * @internal
 */
type MapFn = <A, B>(fn: PipeFn<A, B>) => (ma: A) => B;

/**
 * Bind operator type.
 *
 * @typeParam T - The type of the input value.
 * @typeParam K - The key type for the new property.
 * @typeParam V - The value type for the new property.
 * @param key - The key to identify this bind operation.
 * @param fn - The function that returns a new value to be merged.
 * @returns A bind operator that can be used in a pipeline.
 *
 * @internal
 */
type BindFn = <T, K extends string, V>(
  key: K,
  fn: PipeFn<T, V>,
) => (value: T) => Prettify<T & { [P in K]: V }>;

/**
 * Tap operator type.
 *
 * @typeParam A - The type of the value.
 * @param f - The function to execute as a side effect.
 * @returns A tap operator that can be used in a pipeline.
 *
 * @internal
 */
type TapFn = <A>(fn: PipeFn<A, void>) => (ma: A) => A;

// *********************************************************************************************
// Operators implementations.
// *********************************************************************************************

/**
 * Creates a map operator that applies a function to the value.
 *
 * @typeParam A - The type of the input value.
 * @typeParam B - The type of the output value.
 * @param fn - The function to apply to the value.
 * @returns A map operator that can be used in a pipeline.
 *
 * @example
 * ```ts
 * const pipeline = pipe()
 *  .step('Double', map((n: number) => n * 2))
 * ```
 *
 * @public
 */
const map: MapFn = (fn) => withPipeMetadata((ma) => fn(ma), operatorMetadata(fn, 'map'));

/**
 * Creates a bind operator that merges the result with the previous value.
 *
 * @typeParam T - The type of the input value.
 * @typeParam K - The key type for the new property.
 * @typeParam V - The value type for the new property.
 * @param key - The key to identify this bind operation.
 * @param fn - The function that returns a new value to be merged.
 * @returns A bind operator that can be used in a pipeline.
 *
 * @example
 * ```ts
 * const pipeline = pipe()
 *  .step('Double with factor', bind('multiplier', (n: number) => ({
 *    factor: 2,
 *    result: n * 2
 *  })))
 * ```
 *
 * @public
 */
const bind: BindFn = (key, fn) =>
  withPipeMetadata(
    (value) => ({ ...value, [key]: fn(value) }) as Any,
    operatorMetadata(fn, 'bind'),
  );

/**
 * A tap operator, is a function that allows side effects without changing the value.
 *
 * @typeParam A - The type of the value.
 * @param fn - The function to execute as a side effect.
 * @returns A tap operator that can be used in a pipeline.
 *
 * @example
 * ```ts
 * const pipeline = pipe()
 * .step('Log value', tap((n: number) => Logger.info('Current value:', n)))
 * ```
 *
 * @public
 */
const tap: TapFn = (fn) =>
  withPipeMetadata(
    (ma) => {
      fn(ma);
      return ma;
    },
    operatorMetadata(fn, 'tap'),
  );

export { map, bind, tap };
