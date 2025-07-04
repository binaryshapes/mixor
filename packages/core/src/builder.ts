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
import { pipe } from './pipe';
import { type Result, ok } from './result';

/**
 * Panic error for the builder module.
 *
 * @example
 * ```ts
 * // CORRUPTED_FUNCTION - When a function is missing from the builder during build
 * const stringBuilder = builder({
 *   isString: (a: unknown) => (typeof a === 'string' ? ok(a) : err('NOT_STRING')),
 * });
 *
 * // This would throw CORRUPTED_FUNCTION if the function was missing
 * const validator = stringBuilder.isString().build();
 * ```
 *
 * @example
 * ```ts
 * // FUNCTION_NOT_FOUND - When trying to call a non-existent function
 * const stringBuilder = builder({
 *   isString: (a: unknown) => (typeof a === 'string' ? ok(a) : err('NOT_STRING')),
 * });
 *
 * try {
 *   // This function doesn't exist
 *   stringBuilder.nonExistentFunction();
 * } catch (error) {
 *   // error.key === 'BUILDER:FUNCTION_NOT_FOUND'
 * }
 * ```
 *
 * @example
 * ```ts
 * // FUNCTION_NOT_REPEATABLE - When trying to repeat a non-repeatable function
 * const stringBuilder = builder({
 *   isString: (a: unknown) => (typeof a === 'string' ? ok(a) : err('NOT_STRING')),
 *   minLength: (length: number) => (a: string) => (a.length >= length ? ok(a) : err('TOO_SHORT')),
 * });
 *
 * try {
 *   // isString cannot be repeated
 *   stringBuilder.isString().isString();
 * } catch (error) {
 *   // error.key === 'BUILDER:FUNCTION_NOT_REPEATABLE'
 * }
 * ```
 *
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
 * Mode for handling errors in builder validation.
 *
 * - 'strict': Stop at first error (like flow) - more performant for early validation
 * - 'all': Continue execution and accumulate all errors - useful for collecting all validation issues
 *
 * @example
 * ```ts
 * // Strict mode (default) - stops at first error.
 * const userBuilder = builder({
 *   validateName: (name: string) => (name.length > 0 ? ok(name) : err('INVALID_NAME')),
 *   validateAge: (age: number) => (age >= 0 ? ok(age) : err('INVALID_AGE')),
 *   validateEmail: (email: string) => (email.includes('@') ? ok(email) : err('INVALID_EMAIL')),
 * });
 *
 * const strictValidator = userBuilder
 *   .validateName('')
 *   .validateAge(-5)
 *   .validateEmail('invalid')
 *   .build('strict');
 *
 * const strictResult = strictValidator(''); // err('INVALID_NAME') - stops at first error
 * ```
 *
 * @example
 * ```ts
 * // All mode - collects all errors.
 * const userBuilder = builder({
 *   validateName: (name: string) => (name.length > 0 ? ok(name) : err('INVALID_NAME')),
 *   validateAge: (age: number) => (age >= 0 ? ok(age) : err('INVALID_AGE')),
 *   validateEmail: (email: string) => (email.includes('@') ? ok(email) : err('INVALID_EMAIL')),
 * });
 *
 * const allValidator = userBuilder
 *   .validateName('')
 *   .validateAge(-5)
 *   .validateEmail('invalid')
 *   .build('all');
 *
 * const allResult = allValidator(''); // err(['INVALID_NAME', 'INVALID_AGE', 'INVALID_EMAIL'])
 * ```
 *
 * @public
 */
type BuilderMode = 'strict' | 'all';

/**
 * Describes the signature of a function that can be used in the builder.
 *
 * Builder functions can have two signatures:
 * 1. Direct validation: `(value: T) => Result<T, E>`
 * 2. Parameterized validation: `(...args: A) => (value: T) => Result<T, E>`
 *
 * @typeParam T - The type of the value that the function operates on.
 * @typeParam E - The type of the error that the function can return.
 * @typeParam A - The type of the arguments that the function can take.
 *
 * @example
 * ```ts
 * // Direct validation function.
 * const isString: BuilderFunction<string, 'NOT_STRING'> =
 *   (value: string) => (typeof value === 'string' ? ok(value) : err('NOT_STRING'));
 *
 * // Parameterized validation function.
 * const minLength: BuilderFunction<string, 'TOO_SHORT', [number]> =
 *   (length: number) => (value: string) =>
 *     (value.length >= length ? ok(value) : err('TOO_SHORT'));
 * ```
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
 * Typed Builder that provides type-safe function chaining.
 *
 * The builder automatically tracks:
 * - Input type: The initial input type
 * - Output type: The current output type after transformations
 * - Error union: All possible errors from the chain
 * - Used functions: Functions that have been called (for repeatable control)
 * - Available functions: All functions that can be called
 * - Repeatable functions: Functions that can be called multiple times
 *
 * @typeParam Input - The input type.
 * @typeParam Output - The output type.
 * @typeParam ErrorUnion - The union of all possible errors.
 * @typeParam Used - The already used functions (to control repeatable functions).
 * @typeParam Functions - The available functions.
 * @typeParam Repeatable - The repeatable functions.
 *
 * @example
 * ```ts
 * // Basic builder type
 * const stringBuilder = builder({
 *   isString: (a: unknown) => (typeof a === 'string' ? ok(a) : err('NOT_STRING')),
 *   minLength: (length: number) => (a: string) => (a.length >= length ? ok(a) : err('TOO_SHORT')),
 * });
 *
 * // Type: Builder<unknown, unknown, never, never, typeof functions, undefined>
 * const initial = stringBuilder;
 *
 * // Type: Builder<unknown, string, 'NOT_STRING', 'isString', typeof functions, undefined>
 * const afterIsString = stringBuilder.isString();
 *
 * // Type: Builder<unknown, string, 'NOT_STRING' | 'TOO_SHORT', 'isString' | 'minLength', typeof functions, undefined>
 * const afterMinLength = stringBuilder.isString().minLength(3);
 * ```
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
  build(mode?: BuilderMode): (input: Input) => Result<Output, ErrorUnion>;
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
 * // Basic string validation builder
 * const stringBuilder = builder({
 *   isString: (a: unknown) => (typeof a === 'string' ? ok(a) : err('NOT_STRING')),
 *   minLength: (length: number) => (a: string) => (a.length >= length ? ok(a) : err('TOO_SHORT')),
 *   maxLength: (length: number) => (a: string) => (a.length <= length ? ok(a) : err('TOO_LONG')),
 * });
 *
 * // String validation rules
 * const stringRules = stringBuilder.isString().minLength(3).maxLength(10).build();
 *
 * const r1 = stringRules('hello'); // ok('hello')
 * const r2 = stringRules('hi'); // err('TOO_SHORT')
 * const r3 = stringRules('very long string'); // err('TOO_LONG')
 * ```
 *
 * @example
 * ```ts
 * // Builder with repeatable functions
 * const stringBuilder = builder({
 *   isString: (a: unknown) => (typeof a === 'string' ? ok(a) : err('NOT_STRING')),
 *   minLength: (length: number) => (a: string) => (a.length >= length ? ok(a) : err('TOO_SHORT')),
 *   maxLength: (length: number) => (a: string) => (a.length <= length ? ok(a) : err('TOO_LONG')),
 *   matches: (pattern: RegExp) => (a: string) => (pattern.test(a) ? ok(a) : err('DOES_NOT_MATCH')),
 * }, ['minLength', 'maxLength']); // minLength and maxLength can be repeated
 *
 * // Multiple length validations
 * const validator = stringBuilder
 *   .isString()
 *   .minLength(3)
 *   .minLength(5) // This is allowed because minLength is repeatable
 *   .maxLength(10)
 *   .matches(/^[a-z]+$/)
 *   .build();
 *
 * const result = validator('hello'); // ok('hello')
 * ```
 *
 * @example
 * ```ts
 * // Builder with string transformations (same type)
 * const stringBuilder = builder({
 *   isString: (a: unknown) => (typeof a === 'string' ? ok(a) : err('NOT_STRING')),
 *   trim: (a: string) => ok(a.trim()),
 *   toUpperCase: (a: string) => ok(a.toUpperCase()),
 *   replace: (search: string, replace: string) => (a: string) => ok(a.replace(search, replace)),
 * });
 *
 * // Transform string while maintaining type
 * const transformer = stringBuilder
 *   .isString()
 *   .trim()
 *   .toUpperCase()
 *   .replace('HELLO', 'HI')
 *   .build();
 *
 * const result = transformer('  hello world  '); // ok('HI WORLD')
 * ```
 *
 * @example
 * ```ts
 * // Builder with different error modes (same type)
 * const stringBuilder = builder({
 *   isString: (a: unknown) => (typeof a === 'string' ? ok(a) : err('NOT_STRING')),
 *   nonEmpty: (a: string) => (a.length > 0 ? ok(a) : err('EMPTY_STRING')),
 *   alphanumeric: (a: string) => (/^[a-zA-Z0-9]+$/.test(a) ? ok(a) : err('NOT_ALPHANUMERIC')),
 *   noSpaces: (a: string) => (!a.includes(' ') ? ok(a) : err('CONTAINS_SPACES')),
 * });
 *
 * // Strict mode (default) - stops at first error
 * const strictValidator = stringBuilder
 *   .isString()
 *   .nonEmpty()
 *   .alphanumeric()
 *   .noSpaces()
 *   .build('strict');
 *
 * const strictResult = strictValidator(''); // err('EMPTY_STRING') - stops here
 *
 * // All mode - collects all errors
 * const allValidator = stringBuilder
 *   .isString()
 *   .nonEmpty()
 *   .alphanumeric()
 *   .noSpaces()
 *   .build('all');
 *
 * const allResult = allValidator(' a@b '); // err(['NOT_ALPHANUMERIC', 'CONTAINS_SPACES'])
 * ```
 *
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
        // Processing only the used functions and returning a pipe.
        return (mode: BuilderMode = 'strict') => {
          const fns = steps.map(({ key, args }) => {
            const originalFn = functions[key];
            if (!originalFn) {
              throw new BuilderError('CORRUPTED_FUNCTION', `Function '${String(key)}' not found.`);
            }
            return typeof originalFn === 'function' && args.length > 0
              ? (originalFn as Any)(...args)
              : originalFn;
          });

          // If no functions, return identity function
          if (fns.length === 0) {
            return (input: Any) => ok(input);
          }

          // Use pipe by calling it dynamically to avoid spread issues.
          return pipe(...([mode, ...fns] as Parameters<typeof pipe>));
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
