/*
 * This file is part of the Daikit project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { Any } from './generics';

/**
 * Represents a pipe function which takes any arguments and returns any value.
 *
 * @typeParam A - The type of the arguments array.
 * @typeParam B - The type of the return value.
 *
 * @internal
 */
type PipeFunction<A extends Any[], B> = (...a: A) => B;

/**
 * Overloads for pipe function.
 * This ensures that the pipe function is composed correctly and that the return type is correct.
 *
 * @internal
 */
interface Pipe {
  <A extends Any[], B>(f1: (...a: A) => B): PipeFunction<A, B>;
  <A extends Any[], B, C>(f1: (...a: A) => B, f2: (b: B) => C): PipeFunction<A, C>;
  <A extends Any[], B, C, D>(
    f1: (...a: A) => B,
    f2: (b: B) => C,
    f3: (c: C) => D,
  ): PipeFunction<A, D>;
  <A extends Any[], B, C, D, E>(
    f1: (...a: A) => B,
    f2: (b: B) => C,
    f3: (c: C) => D,
    f4: (d: D) => E,
  ): PipeFunction<A, E>;
}

/**
 * Compose a pipeline of functions.
 * Each function in the pipeline will be executed in sequence, with the output of one function
 * becoming the input of the next function.
 *
 * @param fns - The functions to compose
 * @returns The composed pipeline function
 *
 * @example
 * ```ts
 * // (x: number, y: number) => number
 * const calculate = pipe(
 *   (x: number, y: number) => ({ x, y }),
 *   ({ x, y }) => x + y,
 *   (sum) => sum * 2
 * );
 *
 * const r1 = calculate(2, 3); // 10
 * const r2 = calculate(5, 5); // 20
 * ```
 *
 * @public
 */
const pipe: Pipe = (...fns: PipeFunction<Any, Any>[]) => {
  return (...args: Any[]) => fns.slice(1).reduce((result, fn) => fn(result), fns[0](...args));
};

export { pipe };
