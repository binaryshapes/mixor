/*
 * This file is part of the Daikit project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

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
 * Recursively unwraps all Promise types in a type, including nested objects and arrays.
 *
 * @typeParam T - The type to unwrap Promises from
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
type DeepAwaited<T> =
  T extends Promise<infer U>
    ? DeepAwaited<U>
    : T extends Array<infer A>
      ? Array<DeepAwaited<A>>
      : T extends object
        ? {
            [K in keyof T]: DeepAwaited<T[K]>;
          }
        : T;

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
            [K in keyof T]: T[K] extends Promise<unknown>
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
    ? Array<Prettify<U>>
    : T extends object
      ? {
          [K in keyof T]: T[K] extends PrimitiveType ? Prettify<T[K]> : T[K];
        }
      : T;

export type { Any, DeepAwaited, HasPromise, Prettify, PrimitiveType };
