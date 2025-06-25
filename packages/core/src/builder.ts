/*
 * This file is part of the Daikit project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { flow, map } from './flow';
import type { Any } from './generics';
import { Panic } from './panic';
import { type Result, ok } from './result';

/**
 * Panic error for the builder module.
 * @public
 */
class BuilderError extends Panic<
  'BUILDER',
  // A corrupted state of the builder.
  | 'CORRUPTED_METHOD'
  // A method is not found in the builder.
  | 'METHOD_NOT_FOUND'
  // A method is not repeatable in the builder.
  | 'METHOD_NOT_REPEATABLE'
>('BUILDER') {}

/**
 * Describes the signature of a method that can be used in the builder.
 *
 * @typeParam T - The type of the value that the method operates on.
 * @typeParam E - The type of the error that the method can return.
 * @typeParam A - The type of the arguments that the method can take.
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

type MethodsRecord = Record<string, BuilderFunction<Any, Any, Any[]>>;

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
 * @typeParam Used - The already used methods (to control repeatable methods).
 * @typeParam Methods - The available methods.
 * @typeParam Repeatable - The repeatable methods.
 *
 * @public
 */
type Builder<
  Input,
  Output,
  ErrorUnion,
  Used extends keyof Methods,
  Methods extends MethodsRecord,
  Repeatable extends readonly (keyof Methods)[] | undefined = undefined,
> = {
  [K in keyof Methods as K extends Used
    ? K extends UnionOfArray<Repeatable>
      ? K
      : never
    : K]: Methods[K] extends (...args: infer A) => (a: Output) => Result<infer O, infer E>
    ? (...args: A) => Builder<Input, O, ErrorUnion | E, Used | K, Methods, Repeatable>
    : Methods[K] extends (a: Output) => Result<infer O, infer E>
      ? () => Builder<Input, O, ErrorUnion | E, Used | K, Methods, Repeatable>
      : never;
} & {
  build(): (input: Input) => Result<Output, ErrorUnion>;
};

/**
 * Creates a new builder instance with automatic type inference.
 * Each chained method updates the output type and error union.
 *
 * @typeParam Methods - The record type containing the builder methods.
 * @typeParam Repeatable - The array type of repeatable method keys.
 * @typeParam Input - The input type (inferred from methods).
 * @typeParam Output - The output type after transformations.
 * @typeParam ErrorUnion - The union of all possible errors.
 * @typeParam Used - The union of method keys that have been used in the chain.
 * @param methods - The methods to use in the builder.
 * @param repeatable - Array of method names that can be repeated in the chain.
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
  Methods extends MethodsRecord,
  Repeatable extends readonly (keyof Methods)[] | undefined = undefined,
  Input = BuilderFunctionInput<Methods[keyof Methods]>,
  Output = Input,
  ErrorUnion = never,
  Used extends keyof Methods = never,
>(
  methods: Methods,
  repeatable?: Repeatable,
  steps: { key: keyof Methods; args: Any[] }[] = [],
): Builder<Input, Output, ErrorUnion, Used, Methods, Repeatable> {
  const handler: ProxyHandler<Any> = {
    get(_, prop: string) {
      if (prop === 'build') {
        return () => {
          const fns = steps.map(({ key, args }) => {
            const method = methods[key];
            if (!method) {
              throw new BuilderError('CORRUPTED_METHOD', `Method '${String(key)}' not found.`);
            }

            const fn =
              typeof method === 'function' && args.length > 0 ? (method as Any)(...args) : method;
            return map(fn);
          });
          return (flow as Any)((x: Any) => ok(x), ...fns) as Any;
        };
      }

      if (!(prop in methods)) {
        throw new BuilderError('METHOD_NOT_FOUND', `Method '${prop}' not found in builder.`);
      }

      const usedCount = steps.filter((s) => s.key === prop).length;
      const isRepeatable = repeatable && (repeatable as readonly string[]).includes(prop);

      if (usedCount > 0 && !isRepeatable) {
        throw new BuilderError(
          'METHOD_NOT_REPEATABLE',
          `Method '${prop}' cannot be used more than once.`,
        );
      }

      return (...args: Any[]) => {
        return builder<
          Methods,
          Repeatable,
          Input,
          BuilderFunctionOutput<Methods[typeof prop & keyof Methods]>,
          ErrorUnion | BuilderFunctionError<Methods[typeof prop & keyof Methods]>,
          Used | (typeof prop & keyof Methods)
        >(methods, repeatable, [...steps, { key: prop, args }]);
      };
    },
  };
  return new Proxy({}, handler);
}

export type { Builder };
export { builder, BuilderError };
