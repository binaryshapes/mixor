/*
 * This file is part of the Daikit project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// *********************************************************************************************
// General purpose types.
// *********************************************************************************************

/**
 * Any is used to reflect justified `any` values through the codebase and avoid use the explicit
 * `any` type.
 *
 * @public
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

/**
 * PrimitiveType is a type that represents all the primitive types.
 *
 * @public
 */
type PrimitiveType = string | number | boolean | null | undefined | bigint | symbol;

/**
 * PrimitiveTypeExtended is a type that represents all the primitive types and some other types
 * that are not primitive but are considered primitive in some scenarios.
 *
 * @public
 */
type PrimitiveTypeExtended = PrimitiveType | Date | RegExp | Array<Any>;

/**
 * Recursively unwraps all Promise types in a type, including nested objects and arrays.
 *
 * @typeParam T - The type to unwrap Promises from
 * @typeParam O - The type of the object to avoid unwrapping.
 *
 * @example
 * ```ts
 * type User = {
 *   id: number;
 *   name: string;
 *   nested: {
 *     email: Promise<string>;
 *   };
 *   tags: Promise<string[]>;
 * };
 *
 * type ResolvedUser = DeepAwaited<User>;
 * // Result:
 * // {
 * //   id: number;
 * //   name: string;
 * //   nested: {
 * //     email: string;
 * //   };
 * //   tags: string[];
 * // }
 * ```
 */
type DeepAwaited<T, O extends Record<string, Any> = never> =
  T extends Promise<infer U>
    ? DeepAwaited<U, O>
    : T extends Array<infer A>
      ? Array<DeepAwaited<A>>
      : T extends object
        ? T extends O
          ? T
          : {
              [K in keyof T]: DeepAwaited<T[K], O>;
            }
        : T;

/**
 * Helper type to detect if a type is a Promise
 *
 * @typeParam T - The type to check
 * @returns True if T is a Promise
 *
 * @public
 */
type IsPromise<T> = T extends Promise<unknown> ? true : false;

/**
 * Inspect if any of the sub-types are promises.
 *
 * @typeParam T - The type to inspect.
 * @returns True if any of the sub-types are promises, false otherwise.
 *
 * @public
 */
type HasPromise<T> =
  T extends Promise<unknown>
    ? true
    : T extends Array<infer U>
      ? HasPromise<U>
      : T extends object
        ? {
            [K in keyof T]: IsPromise<T[K]> extends true
              ? true
              : T[K] extends object
                ? HasPromise<T[K]>
                : false;
          }[keyof T] extends false
          ? false
          : true
        : false;

/**
 * Prettify is a type that converts a messy complex/composed types into a more readable format.
 *
 * @typeParam T - The type to prettify.
 * @returns The prettified type.
 *
 * @public
 */
type Prettify<T> = T extends PrimitiveType
  ? T
  : {} & T extends Array<infer U>
    ? // FIXME: Check if this is correct for arrays. We have some cases where the array is
      // changed. Ej: [string, string, number] -> (string | number)[]. See more in pipe helpers.
      Array<Prettify<U>>
    : T extends object
      ? {
          [K in keyof T]: T[K] extends PrimitiveType ? Prettify<T[K]> : T[K];
        }
      : T;

/**
 * Remove functions from a type.
 *
 * @typeParam T - The type to remove functions from.
 * @returns The type without functions.
 *
 * @public
 */
type NonFunction<T> = T extends (...args: Any[]) => infer V ? V : T;

/**
 * Constructable is a type that represents a constructor function.
 *
 * @public
 */
type Constructor<A = Any, B = Any> = new (...args: A[]) => B;

/**
 * Stringify is a type that converts a type into a string representation.
 *
 * @typeParam T - The type to stringify.
 * @returns The string representation of the type.
 *
 * @public
 */
type Stringify<T> = T extends string
  ? 'string'
  : T extends number
    ? 'number'
    : T extends boolean
      ? 'boolean'
      : T extends bigint
        ? 'bigint'
        : T extends null
          ? 'null'
          : T extends undefined
            ? 'undefined'
            : T extends (...args: Any[]) => Any
              ? T extends (arg: infer I) => infer O
                ? `(value: ${Stringify<I>}) => ${Stringify<O>}`
                : 'Function'
              : T extends object
                ? 'Object'
                : 'Unknown';

// *********************************************************************************************
// Generics related with tuples.
// *********************************************************************************************

/**
 * Detects all unique types in an array and returns the array with the unique types.
 * If all elements of the array are the same type, return that type.
 *
 * @typeParam T - The array to compact.
 *
 * @example
 * ```ts
 * type Test = CompactArray<[string, string, number]>; // Result: [string, number]
 * type Test2 = CompactArray<[true, true, true]>; // Result: true
 * ```
 *
 * @public
 */
// TODO: change name to CompactTuple.
type CompactArray<T extends readonly unknown[]> = T extends readonly [infer H, ...infer R]
  ? R extends readonly []
    ? H
    : R extends readonly [H, ...infer Rest]
      ? CompactArray<[H, ...Rest]>
      : T
  : T;

/**
 * Inspect if a array of types has a specific type.
 * The match must be exact. For example, `string | number` is not the same type as `number`.
 *
 * @typeParam T - The array to inspect.
 * @typeParam U - The type to inspect.
 * @returns True if any of the sub-types are the same type as the given type, false otherwise.
 *
 * @example
 * ```ts
 * type Test = ArrayHasType<[string, number, boolean], string>; // Result: true
 * type Test2 = ArrayHasType<[string, number, boolean], number>; // Result: true
 * type Test3 = ArrayHasType<[string, number, boolean], boolean>; // Result: true
 * type Test4 = ArrayHasType<[string, number, boolean], string | number>; // Result: true
 * ```
 *
 * @public
 */
// TODO: change name to TupleHasType.
type ArrayHasType<T, U> = T extends [infer H, ...infer R]
  ? [H] extends [U]
    ? true
    : ArrayHasType<R, U>
  : false;

/**
 * Get the first element of a tuple.
 *
 * @typeParam T - The tuple to get the first element from.
 * @returns The first element of the tuple.
 *
 * @public
 */
type Head<T extends Any[]> = T extends [infer H, ...Any[]] ? H : never;

/**
 * Get the last element of a tuple.
 *
 * @typeParam T - The tuple to get the last element from.
 * @returns The last element of the tuple.
 *
 * @public
 */
type Tail<T extends Any[]> = T extends [Any, ...infer R] ? R : never;

/**
 * Check if a tuple is homogeneous. Which means that all elements of the tuple are the same type.
 * For example, `[string, string, string]` is homogeneous, but `[string, number, string]` is not.
 * If the tuple is empty, it is considered homogeneous. If you don't want to consider empty tuples
 * as homogeneous, you may use `IsEmptyTuple` to check if the tuple is empty after the check.
 *
 * @typeParam T - The tuple to check.
 * @returns True if the tuple is homogeneous, false otherwise.
 *
 * @public
 */
type HomogeneousTuple<T extends Any[]> = T extends []
  ? true
  : Tail<T> extends []
    ? true
    : Head<T> extends Head<Tail<T>>
      ? HomogeneousTuple<Tail<T>>
      : false;

/**
 * Check if a tuple is empty.
 *
 * @typeParam T - The tuple to check.
 * @returns True if the tuple is empty, false otherwise.
 *
 * @public
 */
type IsEmptyTuple<T extends Any[]> = T extends [] ? true : false;

// *********************************************************************************************
// Generics related to type errors.
// *********************************************************************************************

/**
 * TypeError is a type that represents a type error.
 * Useful to define type errors in a type-safe way.
 *
 * @typeParam Msg - The message of the error.
 * @returns The type error.
 *
 * @public
 */
type TypeError<Scope extends Uppercase<string>, Msg extends string> = {
  error: `${Scope}: ${Msg}`;
};

/**
 * WithError is a type that adds an error message to a type.
 * Useful to add an error message to a type that already has a type error.
 *
 * @typeParam T - The type to add the error message to.
 * @typeParam M - The type that contains the error message.
 * @returns The type with the error message.
 *
 * public
 */
type WithError<T, M> = M extends { error: infer Msg } ? Msg & T : T;

export type {
  // General purpose types.
  Any,
  PrimitiveType,
  PrimitiveTypeExtended,
  DeepAwaited,
  IsPromise,
  HasPromise,
  Prettify,
  NonFunction,
  Constructor,
  Stringify,
  // Generics related with tuples.
  CompactArray,
  ArrayHasType,
  Head,
  Tail,
  HomogeneousTuple,
  IsEmptyTuple,
  // Generics related with type errors.
  TypeError,
  WithError,
};
