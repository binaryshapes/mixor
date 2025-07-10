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
 * Prettify is a type that converts a messy complex/composed types into a more readable format.
 *
 * @typeParam T - The type to prettify.
 * @returns The prettified type.
 *
 * @public
 */
type Prettify<T> = T extends PrimitiveType | never
  ? T
  : {} & T extends Array<infer U>
    ? // TODO: Check if this is correct for arrays. We have some cases where the array is
      // changed. Ej: [string, string, number] -> (string | number)[]. See more in pipe helpers.
      Array<Prettify<U>>
    : T extends object
      ? {
          [K in keyof T]: T[K] extends PrimitiveType ? Prettify<T[K]> : T[K];
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
 *
 * @public
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
 * Checks if a type is a primitive type.
 *
 * @typeParam T - The type to check.
 * @returns True if the type is a primitive type, false otherwise.
 *
 * @public
 */
type IsPrimitive<T> = T extends object ? false : true;

// *********************************************************************************************
// Object manipulation types.
// *********************************************************************************************

/**
 * Gets all the keys of a union type.
 *
 * @typeParam T - The type to get the keys from.
 * @returns The keys of the union type.
 *
 * @public
 */
type UnionKeys<T> = T extends T ? keyof T : never;

/**
 * Checks if two types are equal.
 *
 * @typeParam X - The first type to compare.
 * @typeParam Y - The second type to compare.
 * @returns True if the types are equal, false otherwise.
 *
 * @public
 */
type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? true : false;

/**
 * If property K in T is readonly, make V readonly, else leave as is.
 *
 * @typeParam T - The type to check.
 * @typeParam K - The key to check.
 * @typeParam V - The value to check.
 * @returns The value with the readonly modifier.
 *
 * @public
 */
type IfReadonly<T, K extends keyof T, V> =
  Equal<{ [P in K]: T[P] }, { -readonly [P in K]: T[P] }> extends true ? V : Readonly<V>;

/**
 * For each property in T, preserve readonly modifier from T in U.
 *
 * @typeParam T - The type to check.
 * @typeParam U - The type to check.
 * @returns The type with the readonly modifier.
 *
 * @public
 */
type PreserveReadonly<T, U> = {
  [K in keyof T]: IfReadonly<T, K, U[Extract<K, keyof U>]>;
};

/**
 * Merges a union type into a single type.
 * Preserves readonly modifiers per property.
 *
 * @typeParam T - The type to merge.
 * @returns The merged type.
 *
 * @example
 * ```ts
 * type User = {
 *   name: string;
 *   category: 'admin';
 * } | {
 *   name: string;
 *   category:  'user';
 * };
 *
 * type UserMerged = MergeUnion<User>;
 * // Result:
 * // {
 * //   name: string;
 * //   category: 'admin' | 'user';
 * // }
 * ```
 *
 * @example
 * ```ts
 * // Preserves readonly modifiers
 * type ReadonlyUser = {
 *   readonly name: string;
 *   readonly email: string;
 * };
 *
 * type MergedReadonlyUser = MergeUnion<ReadonlyUser>;
 * // Result: { readonly name: string; readonly email: string; }
 * ```
 *
 * @public
 */
type MergeUnion<T> =
  IsPrimitive<T> extends true
    ? T
    : T extends object
      ? Prettify<
          PreserveReadonly<
            T,
            {
              [K in UnionKeys<T>]: T extends Any ? (K extends keyof T ? T[K] : never) : never;
            }
          >
        >
      : {
          [K in UnionKeys<T>]: T extends Any ? (K extends keyof T ? T[K] : never) : never;
        };

export type {
  // General purpose types.
  Any,
  Prettify,
  PrimitiveType,
  PrimitiveTypeExtended,
  HasPromise,
  IsPromise,
  DeepAwaited,
  IsPrimitive,
  // Object manipulation types.
  UnionKeys,
  MergeUnion,
  Equal,
  IfReadonly,
  PreserveReadonly,
};
