/*
 * This file is part of the Daikit project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { Any } from './generics';
import { type Result, isErr, isOk } from './result';

/**
 * Overloads for flow function.
 * This ensures that the flow function is composed correctly and that the return type is correct.
 *
 * @internal
 */
interface Flow {
  <A extends Any[], B, E>(f1: (...args: A) => Result<B, E>): (...args: A) => Result<B, E>;
  <A extends Any[], B, C, E1, E2>(
    f1: (...args: A) => Result<B, E1>,
    f2: (b: Result<B, E1>) => Result<C, E2>,
  ): (...args: A) => Result<C, E2>;
  <A extends Any[], B, C, D, E1, E2, E3>(
    f1: (...args: A) => Result<B, E1>,
    f2: (b: Result<B, E1>) => Result<C, E2>,
    f3: (c: Result<C, E2>) => Result<D, E3>,
  ): (...args: A) => Result<D, E3>;
  <A extends Any[], B, C, D, E, E1, E2, E3, E4>(
    f1: (...args: A) => Result<B, E1>,
    f2: (b: Result<B, E1>) => Result<C, E2>,
    f3: (c: Result<C, E2>) => Result<D, E3>,
    f4: (d: Result<D, E3>) => Result<E, E4>,
  ): (...args: A) => Result<E, E4>;
  <A extends Any[], B, C, D, E, F, E1, E2, E3, E4, E5>(
    f1: (...args: A) => Result<B, E1>,
    f2: (b: Result<B, E1>) => Result<C, E2>,
    f3: (c: Result<C, E2>) => Result<D, E3>,
    f4: (d: Result<D, E3>) => Result<E, E4>,
    f5: (e: Result<E, E4>) => Result<F, E5>,
  ): (...args: A) => Result<F, E5>;
}

/**
 * Compose a flow of functions with `Result` type.
 * Each function in the flow will only be executed if the previous function returned a
 * successful Result. If any function returns an error, the flow will stop and return that
 * error.
 *
 * @remarks The flow function will return a `Result` instead of a value and the error channel will
 * accumulate the errors. It is recommended to use the built-in operators to map over the value and
 * the error.
 *
 * @param fns - The functions to compose, each returning a Result.
 * @returns The composed flow function.
 *
 * @example
 * ```ts
 * // (x: number, y: number) => Result<number, "CANNOT_DIVIDE_BY_ZERO" | "NOT_POSITIVE">
 * const divide = flow(
 *   (x: number, y: number) => ok({ x, y }),
 *   map(({ x, y }) => y === 0 ? err("CANNOT_DIVIDE_BY_ZERO") : ok(x / y)),
 *   map((result) => result < 0 ? err("NOT_POSITIVE") : ok(result))
 * );
 *
 * // r1, r2, r3 are of type Result<number, "CANNOT_DIVIDE_BY_ZERO" | "NOT_POSITIVE">
 * const r1 = divide(10, 0); // { _id: 'Result', _tag: 'Err', error: 'CANNOT_DIVIDE_BY_ZERO' }
 * const r2 = divide(-10, 20); // { _id: 'Result', _tag: 'Err', error: 'NOT_POSITIVE' }
 * const r3 = divide(10, 20); // { _id: 'Result', _tag: 'Ok', value: 0.5 }
 * ```
 *
 * @example
 * ```ts
 * // Note: When a previous step returns an error, map functions receive 'never' as input
 * // This is normal - the map function won't execute, but TypeScript needs a type.
 * const example = flow(
 *   () => err("ERROR"),
 *   map((x) => ok(x + 1)) // x is 'never', but this is expected behavior
 * );
 * ```
 *
 * @public
 */
const flow: Flow =
  (...fns: ((...args: Any[]) => Result<Any, Any>)[]) =>
  (...args: Any[]) =>
    fns.slice(1).reduce((r, fn) => fn(r), fns[0](...args));

// *********************************************************************************************
// Flow operators.
// *********************************************************************************************

/**
 * Maps the success side of a Result to a new Result.
 * Only executes if the previous Result was successful.
 *
 * @typeParam A - The input type.
 * @typeParam B - The output type.
 * @typeParam E - The error type.
 * @param f - The function to map over the value.
 * @returns A function that takes a value and returns a Result.
 *
 * @example
 * ```ts
 * const fl = flow(
 *   (x: number, y: number) => ok({ x, y }),
 *   map(({ x, y }) => y === 0 ? err("ZERO_DIVISOR") : ok(x / y))
 * );
 *
 * const r = fl(10, 0); // { _id: 'Result', _tag: 'Err', error: 'ZERO_DIVISOR' }
 * const r2 = fl(10, 20); // { _id: 'Result', _tag: 'Ok', value: 0.5 }
 * ```
 *
 * @public
 */
const map =
  <A, B, E, F>(f: (v: A) => Result<B, F>) =>
  (r: Result<A, E>) =>
    isOk(r) ? f(r.value) : r;

/**
 * Maps the error side of a Result to a new Result.
 * Only executes if the previous Result was an error.
 *
 * @typeParam A - The input type.
 * @typeParam B - The output type.
 * @typeParam E - The error type.
 * @param f - The function to map over the error.
 * @returns A function that takes a Result and returns a new Result with the mapped error.
 *
 * @example
 * ```ts
 * const fl = flow(
 *   (x: number, y: number) => ok({ x, y }),
 *   mapErr((e) => err('SOME_ERROR'))
 * );
 *
 * const r = fl(10, 0); // { _id: 'Result', _tag: 'Err', error: 'SOME_ERROR' }
 * ```
 *
 * @public
 */
const mapErr =
  <A, B, E, F>(f: (e: E) => Result<B, F>) =>
  (r: Result<A, E>) =>
    isErr(r) ? f(r.error) : r;

/**
 * Options for the mapBoth function.
 *
 * @typeParam A - The input type.
 * @typeParam B - The output type.
 * @typeParam E - The error type.
 * @typeParam F - The new error type.
 *
 * @internal
 */
type MapBothOptions<A, B, E, F> = {
  onOk: (value: A) => Result<B, F>;
  onErr: (error: E) => Result<B, F>;
};

/**
 * Maps the success and error sides of a Result to a new Result.
 *
 * @typeParam A - The input type.
 * @typeParam B - The output type.
 * @typeParam E - The error type.
 * @typeParam F - The new error type.
 * @param o - Options for the mapBoth function.
 * @returns A function that takes a Result and returns a new Result with the new mapped value and
 * error.
 *
 * @example
 * ```ts
 * const fl = flow(
 *   (x: number, y: number) => ok({ x, y }),
 *   mapBoth({
 *     onOk: ({ x, y }) => y === 0 ? err("ZERO_DIVISOR") : ok(x / y),
 *     onErr: (e) => err('ANOTHER_ERROR')
 *   })
 * );
 * ```
 *
 * @public
 */
const mapBoth =
  <A, B, E, F>(o: MapBothOptions<A, B, E, F>) =>
  (r: Result<A, E>) =>
    isOk(r) ? o.onOk(r.value) : o.onErr(r.error);

export { flow, map, mapErr, mapBoth };
