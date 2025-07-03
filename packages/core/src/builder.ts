/*
 * This file is part of the Daikit project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { flow } from './flow';
import type { Any } from './generics';
import { Panic } from './panic';
import { type Result } from './result';

/**
 * Panic error for the builder module.
 * @public
 */
class BuilderError extends Panic<
  'BUILDER',
  // A corrupted state of the builder.
  | 'CORRUPTED_FUNCTION'
  // A function is not found in the builder.
  | 'FUNCTION_NOT_FOUND'
  // A function is not repeatable in the builder.
  | 'FUNCTION_NOT_REPEATABLE'
>('BUILDER') {}

/**
 * Describes the signature of a function that can be used in the builder.
 *
 * @typeParam T - The type of the value that the function operates on.
 * @typeParam E - The type of the error that the function can return.
 * @typeParam A - The type of the arguments that the function can take.
 *
 * @internal
 */
type BuilderFunction<T, E, A extends Any[] = []> =
  | ((a: T) => Result<T, E>)
  | ((...args: A) => (a: T) => Result<T, E>);

/**
 * Infer the input type of a builder function.
 *
 * @typeParam F - The type of the builder function.
 * @returns The type of the input of the function.
 *
 * @internal
 */
type BuilderFunctionInput<F> = F extends BuilderFunction<infer I, Any, Any> ? I : never;

/**
 * Infer the output type of a builder function.
 *
 * @typeParam F - The type of the builder function.
 * @returns The type of the output of the function.
 *
 * @internal
 */
type BuilderFunctionOutput<F> =
  F extends BuilderFunction<Any, Any, Any>
    ? F extends (a: Any) => Result<infer O, Any>
      ? O
      : F extends (...args: Any[]) => (a: Any) => Result<infer O, Any>
        ? O
        : never
    : never;

/**
 * Infer the error type of a builder function.
 *
 * @typeParam F - The type of the builder function.
 * @returns The type of the error of the function.
 *
 * @internal
 */
type BuilderFunctionError<F> = F extends BuilderFunction<Any, infer E, Any> ? E : never;

/**
 * Record of builder functions.
 *
 * @internal
 */
type BuilderFunctionsRecord = Record<string, BuilderFunction<Any, Any, Any[]>>;

/**
 * Extract the union of array elements.
 *
 * @typeParam T - The type of the array.
 * @returns The union of the array elements.
 *
 * @internal
 */
type UnionOfArray<T> = T extends Array<infer U> ? U : never;

/**
 * Typed Builder.
 *
 * @typeParam Input - The input type.
 * @typeParam Output - The output type.
 * @typeParam ErrorUnion - The union of all possible errors.
 * @typeParam Used - The already used functions (to control repeatable functions).
 * @typeParam Functions - The available functions.
 * @typeParam Repeatable - The repeatable functions.
 *
 * @public
 */
type Builder<
  Input,
  Output,
  ErrorUnion,
  Used extends keyof Functions,
  Functions extends BuilderFunctionsRecord,
  Repeatable extends readonly (keyof Functions)[] | undefined = undefined,
> = {
  [K in keyof Functions as K extends Used
    ? K extends UnionOfArray<Repeatable>
      ? K
      : never
    : K]: Functions[K] extends (...args: infer A) => (a: Output) => Result<infer O, infer E>
    ? (...args: A) => Builder<Input, O, ErrorUnion | E, Used | K, Functions, Repeatable>
    : Functions[K] extends (a: Output) => Result<infer O, infer E>
      ? () => Builder<Input, O, ErrorUnion | E, Used | K, Functions, Repeatable>
      : never;
} & {
  build(): (input: Input) => Result<Output, ErrorUnion>;
};

/**
 * Creates a new builder instance with automatic type inference.
 * Each chained function updates the output type and error union.
 *
 * @typeParam Functions - The record type containing the builder functions.
 * @typeParam Repeatable - The array type of repeatable function keys.
 * @typeParam Input - The input type (inferred from functions).
 * @typeParam Output - The output type after transformations.
 * @typeParam ErrorUnion - The union of all possible errors.
 * @typeParam Used - The union of function keys that have been used in the chain.
 * @param functions - The functions to use in the builder.
 * @param repeatable - Array of function names that can be repeated in the chain.
 * @param steps - Internal state for tracking applied steps.
 * @returns A typed builder instance.
 *
 * @example
 * ```ts
 * // String builder.
 * const stringBuilder = builder({
 *   isString: (a: unknown) => (typeof a === 'string' ? ok(a) : err('NOT_STRING')),
 *   minLength: (length: number) => (a: string) => (a.length >= length ? ok(a) : err('TOO_SHORT')),
 *   maxLength: (length: number) => (a: string) => (a.length <= length ? ok(a) : err('TOO_LONG')),
 * });
 *
 * // String Rules.
 * const stringRules = stringBuilder.isString().minLength(3).maxLength(10).build();
 *
 * const r1 = stringRules('hello'); // Ok
 * const r2 = stringRules('hi'); // Err: TOO_SHORT
 * const r3 = stringRules('very long string'); // Err: TOO_LONG
 * // @ts-expect-error - This should be an error.
 * const r4 = stringRules(123); // Err: NOT_STRING
 * ```
 * @public
 */
function builder<
  Functions extends BuilderFunctionsRecord,
  Repeatable extends readonly (keyof Functions)[] | undefined = undefined,
  Input = BuilderFunctionInput<Functions[keyof Functions]>,
  Output = Input,
  ErrorUnion = never,
  Used extends keyof Functions = never,
>(
  functions: Functions,
  repeatable?: Repeatable,
  steps: { key: keyof Functions; args: Any[] }[] = [],
): Builder<Input, Output, ErrorUnion, Used, Functions, Repeatable> {
  const handler: ProxyHandler<Any> = {
    get(_, prop: string) {
      if (prop === 'build') {
        // Processing only the used functions and returning a flow.
        return () => {
          const fns = steps.map(({ key, args }) => {
            const originalFn = functions[key];
            if (!originalFn) {
              throw new BuilderError('CORRUPTED_FUNCTION', `Function '${String(key)}' not found.`);
            }
            return typeof originalFn === 'function' && args.length > 0
              ? (originalFn as Any)(...args)
              : originalFn;
          });

          return fns.reduce((acc, fn) => acc.map(fn as Any), flow<Input>()).build();
        };
      }

      if (!(prop in functions)) {
        throw new BuilderError('FUNCTION_NOT_FOUND', `Function '${prop}' not found in builder.`);
      }

      const usedCount = steps.filter((s) => s.key === prop).length;
      const isRepeatable = repeatable && (repeatable as readonly string[]).includes(prop);

      if (usedCount > 0 && !isRepeatable) {
        throw new BuilderError(
          'FUNCTION_NOT_REPEATABLE',
          `Function '${prop}' cannot be used more than once.`,
        );
      }

      return (...args: Any[]) => {
        return builder<
          Functions,
          Repeatable,
          Input,
          BuilderFunctionOutput<Functions[typeof prop & keyof Functions]>,
          ErrorUnion | BuilderFunctionError<Functions[typeof prop & keyof Functions]>,
          Used | (typeof prop & keyof Functions)
        >(functions, repeatable, [...steps, { key: prop, args }]);
      };
    },
  };
  return new Proxy({}, handler);
}

export type { Builder };
export { builder, BuilderError };
