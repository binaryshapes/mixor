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
type Prettify<T> = T extends PrimitiveType
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

export type { Any, Prettify, PrimitiveType, PrimitiveTypeExtended };
