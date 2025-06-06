/*
 * This file is part of the Daikit project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { Any, DeepAwaited, Stringify, TypeError, WithError } from '../utils';
import { map } from './operators';
import { type HasAsyncStep, type Pipe, type PipeFn, type PipeStep, pipe } from './pipe';

/**
 * Type error for an invalid chain.
 *
 * @typeParam Fn - The index of the function in the chain.
 * @typeParam E - The expected type.
 * @typeParam A - The actual type.
 *
 * @internal
 */
type InvalidChainError<Fn extends number, E extends string, A extends string> = TypeError<
  'INVALID CHAIN',
  `Function ${Fn} should return "${E}" instead of "${A}"`
>;

/**
 * Check if a chain is valid.
 * Iterates over the list of functions and checks if the input and output types are compatible.
 * If the types are not compatible, it returns a type error.
 *
 * @typeParam Fns - The list of functions to chain.
 * @returns True if the chain is valid, otherwise a type error.
 *
 * @internal
 */
type IsValidChain<
  Fns extends readonly PipeFn<Any, Any>[],
  Index extends number[] = [],
> = Fns extends readonly [PipeFn<Any, infer B>, PipeFn<infer C, infer D>, ...infer Rest]
  ? [DeepAwaited<B>] extends [DeepAwaited<C>]
    ? Rest extends readonly PipeFn<Any, Any>[]
      ? IsValidChain<[PipeFn<C, D>, ...Rest], [...Index, 0]>
      : true
    : InvalidChainError<Index['length'], Stringify<C>, Stringify<B>>
  : true;

/**
 * Infer the input and output types of a chain.
 *
 * @typeParam Fns - The list of functions to chain.
 * @returns The input and output types of the chain.
 *
 * @internal
 */
type InferChainIO<Fns extends readonly PipeFn<Any, Any>[]> = Fns extends readonly [
  PipeFn<infer I, Any>,
  ...Any[],
]
  ? Fns extends readonly [...Any[], PipeFn<Any, infer O>]
    ? { input: DeepAwaited<I>; output: DeepAwaited<O> }
    : never
  : never;

/**
 * Check if a chain is valid.
 * If the types are not compatible, it returns a type error.
 * If the types are compatible, it returns the list of functions.
 *
 * @typeParam Fns - The list of functions to chain.
 * @returns The list of functions if the chain is valid, otherwise a type error.
 *
 * @internal
 */
type ValidChain<Fns extends readonly PipeFn<Any, Any>[]> =
  IsValidChain<Fns> extends true ? Fns : WithError<Fns, IsValidChain<Fns>>;

/**
 * Iterates over the list of functions and creates a list of pipe steps.
 *
 * @typeParam Fns - The list of functions to chain.
 * @returns The input and output types of the chain.
 *
 * @internal
 */
type ChainPipeSteps<Fns extends readonly PipeFn<Any, Any>[]> = Fns extends readonly [
  PipeFn<infer I, infer O>,
  ...infer Rest,
]
  ? Rest extends readonly PipeFn<Any, Any>[]
    ? [PipeStep<I, O>, ...ChainPipeSteps<Rest>]
    : [PipeStep<I, O>]
  : [];

/**
 * Creates a pipe for a list of functions.
 *
 * @typeParam F - The list of functions to chain.
 * @typeParam I - The input type of the pipe.
 * @typeParam O - The output type of the pipe.
 * @typeParam S - The steps of the pipe.
 * @param name - The name of the pipe.
 * @returns A pipe for a list of functions.
 *
 * @internal
 */
const chainPipe = <
  F extends readonly PipeFn<Any, Any>[],
  I = InferChainIO<F>['input'],
  O = InferChainIO<F>['output'],
  S extends PipeStep<Any, Any>[] = ChainPipeSteps<F>,
>(
  name: string,
) => pipe<I>(name) as unknown as Pipe<I, O, S, HasAsyncStep<S>>;

/**
 * Creates a chain as a pipe for a list of functions.
 * All functions must be compatible in terms of input and output types to be chained.
 *
 * @param name - The name of the chain.
 * @param fns - The list of functions to chain.
 * @returns A function that chains the list of functions together.
 *
 * @example
 * ```ts
 * // Inline chain.
 * const myChain = chain('my-chain',
 *   (x: string) => x.trim(),
 *   (x: string) => x.toUpperCase(),
 *   (x: string) => x.length.toString(),
 * );
 *
 * // Named functions chain.
 * const trim = (x: string) => x.trim();
 * const toUpperCase = (x: string) => x.toUpperCase();
 * const length = (x: string) => x.length.toString();
 * const myChain = chain('my-chain', trim, toUpperCase, length);
 * ```
 *
 * @public
 */
const chain = <F extends PipeFn<Any, Any>[]>(name: string, ...fns: ValidChain<F>) =>
  fns.reduce(
    (pipe, fn) => pipe.step(fn.name, map(fn)) as unknown as typeof pipe,
    chainPipe<F>(name),
  );

export { chain };
