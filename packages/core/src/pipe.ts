/*
 * This file is part of the Mixor project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { ApplyErrorMode, ErrorMode } from './_err';
import type { Any } from './generics';
import { type Result, err, isOk, ok } from './result';

/**
 * Represents a pipe function which takes any arguments and returns any value.
 * This is the basic pipeline function type for classic pipelines.
 *
 * @typeParam A - The type of the arguments array that the pipeline accepts.
 * @typeParam B - The type of the return value that the pipeline produces.
 *
 * @internal
 */
type PipeFunction<A extends Any[], B> = (...a: A) => B;

/**
 * Represents a pipe function that returns a Result type.
 * This is used for result pipelines that can handle success and error cases.
 *
 * @typeParam A - The type of the arguments array that the pipeline accepts.
 * @typeParam B - The type of the success value that the pipeline produces.
 * @typeParam E - The type of the error value that the pipeline can return.
 *
 * @internal
 */
type PipeResultFunction<A extends Any[], B, E> = (...a: A) => Result<B, E>;

/**
 * Overloads for pipe function with regular functions.
 * This ensures that the pipe function is composed correctly and that the return type is correct.
 * Type-safe up to 10 functions in the pipeline.
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
  <A extends Any[], B, C, D, E, F>(
    f1: (...a: A) => B,
    f2: (b: B) => C,
    f3: (c: C) => D,
    f4: (d: D) => E,
    f5: (e: E) => F,
  ): PipeFunction<A, F>;
  <A extends Any[], B, C, D, E, F, G>(
    f1: (...a: A) => B,
    f2: (b: B) => C,
    f3: (c: C) => D,
    f4: (d: D) => E,
    f5: (e: E) => F,
    f6: (f: F) => G,
  ): PipeFunction<A, G>;
  <A extends Any[], B, C, D, E, F, G, H>(
    f1: (...a: A) => B,
    f2: (b: B) => C,
    f3: (c: C) => D,
    f4: (d: D) => E,
    f5: (e: E) => F,
    f6: (f: F) => G,
    f7: (g: G) => H,
  ): PipeFunction<A, H>;
  <A extends Any[], B, C, D, E, F, G, H, I>(
    f1: (...a: A) => B,
    f2: (b: B) => C,
    f3: (c: C) => D,
    f4: (d: D) => E,
    f5: (e: E) => F,
    f6: (f: F) => G,
    f7: (g: G) => H,
    f8: (h: H) => I,
  ): PipeFunction<A, I>;
  <A extends Any[], B, C, D, E, F, G, H, I, J>(
    f1: (...a: A) => B,
    f2: (b: B) => C,
    f3: (c: C) => D,
    f4: (d: D) => E,
    f5: (e: E) => F,
    f6: (f: F) => G,
    f7: (g: G) => H,
    f8: (h: H) => I,
    f9: (i: I) => J,
  ): PipeFunction<A, J>;
  <A extends Any[], B, C, D, E, F, G, H, I, J, K>(
    f1: (...a: A) => B,
    f2: (b: B) => C,
    f3: (c: C) => D,
    f4: (d: D) => E,
    f5: (e: E) => F,
    f6: (f: F) => G,
    f7: (g: G) => H,
    f8: (h: H) => I,
    f9: (i: I) => J,
    f10: (j: J) => K,
  ): PipeFunction<A, K>;
}

/**
 * Overloads for pipe function with Result functions.
 * Supports both strict and all-error modes for comprehensive error handling.
 * Type-safe up to 10 functions in the pipeline.
 *
 * @internal
 */
interface PipeResult {
  <M extends ErrorMode, A extends Any[], B, E>(
    mode: M,
    f1: (...a: A) => Result<B, E>,
  ): PipeResultFunction<A, B, ApplyErrorMode<E, M>>;
  <M extends ErrorMode, A extends Any[], B, C, E1, E2>(
    mode: M,
    f1: (...a: A) => Result<B, E1>,
    f2: (b: B) => Result<C, E2>,
  ): PipeResultFunction<A, C, ApplyErrorMode<E1 | E2, M>>;
  <M extends ErrorMode, A extends Any[], B, C, D, E1, E2, E3>(
    mode: M,
    f1: (...a: A) => Result<B, E1>,
    f2: (b: B) => Result<C, E2>,
    f3: (c: C) => Result<D, E3>,
  ): PipeResultFunction<A, D, ApplyErrorMode<E1 | E2 | E3, M>>;
  <M extends ErrorMode, A extends Any[], B, C, D, E, E1, E2, E3, E4>(
    mode: M,
    f1: (...a: A) => Result<B, E1>,
    f2: (b: B) => Result<C, E2>,
    f3: (c: C) => Result<D, E3>,
    f4: (d: D) => Result<E, E4>,
  ): PipeResultFunction<A, E, ApplyErrorMode<E1 | E2 | E3 | E4, M>>;
  <M extends ErrorMode, A extends Any[], B, C, D, E, E1, E2, E3, E4, E5>(
    mode: M,
    f1: (...a: A) => Result<B, E1>,
    f2: (b: B) => Result<C, E2>,
    f3: (c: C) => Result<D, E3>,
    f4: (d: D) => Result<E, E4>,
  ): PipeResultFunction<A, E, ApplyErrorMode<E1 | E2 | E3 | E4 | E5, M>>;
  <M extends ErrorMode, A extends Any[], B, C, D, E, F, E1, E2, E3, E4, E5, E6>(
    mode: M,
    f1: (...a: A) => Result<B, E1>,
    f2: (b: B) => Result<C, E2>,
    f3: (c: C) => Result<D, E3>,
    f4: (d: D) => Result<E, E4>,
    f5: (e: E) => Result<F, E5>,
  ): PipeResultFunction<A, E, ApplyErrorMode<E1 | E2 | E3 | E4 | E5 | E6, M>>;
  <M extends ErrorMode, A extends Any[], B, C, D, E, F, G, E1, E2, E3, E4, E5, E6, E7>(
    mode: M,
    f1: (...a: A) => Result<B, E1>,
    f2: (b: B) => Result<C, E2>,
    f3: (c: C) => Result<D, E3>,
    f4: (d: D) => Result<E, E4>,
    f5: (e: E) => Result<F, E5>,
    f6: (f: F) => Result<G, E6>,
  ): PipeResultFunction<A, E, ApplyErrorMode<E1 | E2 | E3 | E4 | E5 | E6 | E7, M>>;
  <M extends ErrorMode, A extends Any[], B, C, D, E, F, G, H, E1, E2, E3, E4, E5, E6, E7, E8>(
    mode: M,
    f1: (...a: A) => Result<B, E1>,
    f2: (b: B) => Result<C, E2>,
    f3: (c: C) => Result<D, E3>,
    f4: (d: D) => Result<E, E4>,
    f5: (e: E) => Result<F, E5>,
    f6: (f: F) => Result<G, E6>,
    f7: (g: G) => Result<H, E7>,
  ): PipeResultFunction<A, E, ApplyErrorMode<E1 | E2 | E3 | E4 | E5 | E6 | E7 | E8, M>>;
  <
    M extends ErrorMode,
    A extends Any[],
    B,
    C,
    D,
    E,
    F,
    G,
    H,
    I,
    E1,
    E2,
    E3,
    E4,
    E5,
    E6,
    E7,
    E8,
    E9,
  >(
    mode: M,
    f1: (...a: A) => Result<B, E1>,
    f2: (b: B) => Result<C, E2>,
    f3: (c: C) => Result<D, E3>,
    f4: (d: D) => Result<E, E4>,
    f5: (e: E) => Result<F, E5>,
    f6: (f: F) => Result<G, E6>,
    f7: (g: G) => Result<H, E7>,
    f8: (h: H) => Result<I, E8>,
  ): PipeResultFunction<A, E, ApplyErrorMode<E1 | E2 | E3 | E4 | E5 | E6 | E7 | E8 | E9, M>>;
  <
    M extends ErrorMode,
    A extends Any[],
    B,
    C,
    D,
    E,
    F,
    G,
    H,
    I,
    J,
    E1,
    E2,
    E3,
    E4,
    E5,
    E6,
    E7,
    E8,
    E9,
    E10,
  >(
    mode: M,
    f1: (...a: A) => Result<B, E1>,
    f2: (b: B) => Result<C, E2>,
    f3: (c: C) => Result<D, E3>,
    f4: (d: D) => Result<E, E4>,
    f5: (e: E) => Result<F, E5>,
    f6: (f: F) => Result<G, E6>,
    f7: (g: G) => Result<H, E7>,
    f8: (h: H) => Result<I, E8>,
    f9: (i: I) => Result<J, E9>,
  ): PipeResultFunction<A, E, ApplyErrorMode<E1 | E2 | E3 | E4 | E5 | E6 | E7 | E8 | E9 | E10, M>>;
  <
    M extends ErrorMode,
    A extends Any[],
    B,
    C,
    D,
    E,
    F,
    G,
    H,
    I,
    J,
    K,
    E1,
    E2,
    E3,
    E4,
    E5,
    E6,
    E7,
    E8,
    E9,
    E10,
    E11,
  >(
    mode: M,
    f1: (...a: A) => Result<B, E1>,
    f2: (b: B) => Result<C, E2>,
    f3: (c: C) => Result<D, E3>,
    f4: (d: D) => Result<E, E4>,
    f5: (e: E) => Result<F, E5>,
    f6: (f: F) => Result<G, E6>,
    f7: (g: G) => Result<H, E7>,
    f8: (h: H) => Result<I, E8>,
    f9: (i: I) => Result<J, E9>,
    f10: (j: J) => Result<K, E10>,
  ): PipeResultFunction<
    A,
    E,
    ApplyErrorMode<E1 | E2 | E3 | E4 | E5 | E6 | E7 | E8 | E9 | E10 | E11, M>
  >;
}

/**
 * Checks the pipeline arguments to determine if it is a result pipe or a classic pipe.
 * A result pipe is identified by having a mode string ('strict' or 'all') as the first argument.
 *
 * @param args - The arguments passed to the pipe function.
 * @returns `true` if the arguments represent a result pipe (with mode), `false` for classic pipe.
 *
 * @example
 * ```ts
 * // Result pipe (has mode as first argument)
 * const isResult = isResultPipe('strict', (x: number) => ok(x + 1)); // true
 *
 * // Classic pipe (no mode argument)
 * const isClassic = isResultPipe((x: number) => x + 1); // false
 * ```
 *
 * @internal
 */
const isResultPipe = (...args: Any[]): boolean =>
  typeof args[0] === 'string' && (args[0] === 'strict' || args[0] === 'all');

/**
 * Compose a pipeline of functions.
 * Each function in the pipeline will be executed in sequence, with the output of one function
 * becoming the input of the next function.
 *
 * @remarks
 * Currently only supports synchronous functions. For more advanced features like async operations,
 * error handling, and complex control flow, consider using the `flow` function.
 *
 * @param args - The arguments to the pipe function:
 * - For classic pipes: A sequence of functions to compose.
 * - For result pipes: A mode string ('strict' | 'all') followed by functions that return Result
 * types.
 * @returns A composed pipeline function that can be called with the initial arguments.
 *
 * @example
 * ```ts
 * // Classic pipeline - simple function composition.
 * const classicPipe = pipe(
 *    (x: number, y: number) => ({ x, y }),
 *    ({ x, y }) => x / y,
 * );
 *
 * const r1 = classicPipe(10, 2); // 5
 * const r2 = classicPipe(5, 0); // Infinity
 * ```
 *
 * @example
 * ```ts
 * // Result pipeline (strict mode) - stops at first error.
 * const resultPipeStrict = pipe(
 *    'strict',
 *    (x: number, y: number) => ok({ x, y }),
 *    ({ x, y }) => (y === 0 ? err('DIVISION_BY_ZERO') : ok(x / y)),
 *    (result) => (result < 0 ? err('NEGATIVE_RESULT') : ok(result)),
 * );
 *
 * const rps1 = resultPipeStrict(10, 2); // ok(5)
 * const rps2 = resultPipeStrict(5, 0); // err('DIVISION_BY_ZERO')
 * const rps3 = resultPipeStrict(-1, 2); // err('NEGATIVE_RESULT')
 * ```
 *
 * @example
 * ```ts
 * // Result pipeline (all mode) - accumulates all errors.
 * const resultPipeAll = pipe(
 *   'all',
 *   ({ name, age }: { name: string; age: number }) => ok({ name, age }),
 *   ({ name, age }) => (age < 0 ? err('INVALID_AGE') : ok({ name, age })),
 *   ({ name, age }) => (name === '' ? err('INVALID_NAME') : ok({ name, age })),
 * );
 *
 * const rpa1 = resultPipeAll({ name: 'John', age: 30 }); // ok({ name: 'John', age: 30 })
 * const rpa2 = resultPipeAll({ name: 'John', age: -5 }); // err(['INVALID_AGE'])
 * const rpa3 = resultPipeAll({ name: '', age: 30 }); // err(['INVALID_NAME'])
 * const rpa4 = resultPipeAll({ name: '', age: -1 }); // err(['INVALID_AGE', 'INVALID_NAME'])
 * ```
 *
 * @example
 * ```ts
 * // Result pipeline (all mode) with multiple arguments - accumulates all errors.
 * const resultPipeAllWithArgs = pipe(
 *   'all',
 *   (name: string, age: number) => ok({ name, age }),
 *   ({ name, age }) => (age < 0 ? err('INVALID_AGE') : ok({ name, age })),
 *   ({ name, age }) => (name === '' ? err('INVALID_NAME') : ok({ name, age })),
 * );
 *
 * const rpa5 = resultPipeAllWithArgs('John', 30); // ok({ name: 'John', age: 30 })
 * const rpa6 = resultPipeAllWithArgs('John', -5); // err(['INVALID_AGE'])
 * const rpa7 = resultPipeAllWithArgs('', 30); // err(['INVALID_NAME'])
 * const rpa8 = resultPipeAllWithArgs('', -1); // err(['INVALID_AGE', 'INVALID_NAME'])
 * ```
 *
 * @public
 */
const pipe: Pipe & PipeResult = (...args: Any[]): Any => {
  // Check if this is a result pipeline (has mode as first argument).
  if (isResultPipe(...args)) {
    const [mode, ...fns] = args;

    return (...funcs: Any[]) => {
      // Strict mode: Stop execution at the first error encountered.
      if (mode === 'strict') {
        // Execute the first function with all arguments, then chain the rest.
        return fns
          .slice(1)
          .reduce(
            (currentResult, fn) => (isOk(currentResult) ? fn(currentResult.value) : currentResult),
            fns[0](...funcs),
          );
      }
      // All mode: Continue execution and accumulate all errors.
      else {
        const { errors, input } = fns.reduce(
          (acc, fn, index) => {
            // First function gets all arguments, subsequent functions get the previous result.
            const fnResult = index === 0 ? fn(...funcs) : fn(acc.input);
            return isOk(fnResult)
              ? { ...acc, input: fnResult.value }
              : { ...acc, errors: [...acc.errors, fnResult.error] };
          },
          {
            input: funcs[0],
            errors: [],
          },
        );
        // Return accumulated errors or the final successful result.
        return errors.length > 0 ? err(errors) : ok(input);
      }
    };
  }
  // Classic pipeline: Simple function composition without error handling.
  else {
    return (...funcs: Any[]) => args.slice(1).reduce((result, fn) => fn(result), args[0](...funcs));
  }
};

export { pipe };
