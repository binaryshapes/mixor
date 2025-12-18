/**
 * This file is part of the Nuxo project.
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

// deno-lint-ignore no-explicit-any
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

// TODO: Prettify should be removed and replaced by CleanTypes.

/**
 * Prettify is a type that converts a messy complex/composed types into a more readable format.
 *
 * @typeParam T - The type to prettify.
 * @returns The prettified type.
 *
 * @public
 */
type Prettify<T> = T extends PrimitiveType | never ? T
  // deno-lint-ignore ban-types
  : {} & T extends Array<infer U>
  // TODO: Check if this is correct for arrays. We have some cases where the array is
  // changed. Ej: [string, string, number] -> (string | number)[]. See more in pipe helpers.
    ? Array<Prettify<U>>
  : T extends object ? {
      [K in keyof T]: T[K] extends PrimitiveType ? Prettify<T[K]> : T[K];
    }
  : T;

/**
 * Pretty the given type.
 *
 * @typeParam T - The type to pretty.
 * @returns The pretty type.
 *
 * @public
 */
type Pretty<T> =
  & {
    [K in keyof T]: T[K];
  }
  // deno-lint-ignore ban-types
  & {};

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
type HasPromise<T> = T extends Promise<unknown> ? true
  : T extends Array<infer U> ? HasPromise<U>
  : T extends object ? {
      [K in keyof T]: IsPromise<T[K]> extends true ? true
        : T[K] extends object ? HasPromise<T[K]>
        : false;
    }[keyof T] extends false ? false
    : true
  : false;

/**
 * Recursively unwraps all Promise types in a type, including nested objects and arrays.
 *
 * @typeParam T - The type to unwrap Promises from
 * @typeParam O - The type of the object to avoid unwrapping.
 *
 * @public
 */
type DeepAwaited<T, O extends Record<string, Any> = never> = T extends Promise<infer U>
  ? DeepAwaited<U, O>
  : T extends Array<infer A> ? Array<DeepAwaited<A>>
  : T extends object ? T extends O ? T
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

/**
 * Literal is a type that represents a literal type.
 *
 * @typeParam T - The type to check.
 * @returns The literal type.
 *
 * @public
 */
type Literal<T> = T extends string | number ? T : never;

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
type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? true
  : false;

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
 * Checks if a type is a plain object.
 *
 * @typeParam T - The type to check.
 * @returns True if the type is a plain object, false otherwise.
 *
 * @internal
 */
type IsPlainObject<T> = T extends readonly Any[] ? false
  : T extends (...args: Any[]) => Any ? false
  : T extends object ? true
  : false;

/**
 * Gets only the plain objects from a type.
 *
 * @typeParam T - The type to get the plain objects from.
 * @returns The plain objects from the type.
 *
 * @internal
 */
type OnlyObjects<T> = T extends Any ? (IsPlainObject<T> extends true ? T : never) : never;

/**
 * Gets the keys of a type.
 *
 * @typeParam T - The type to get the keys from.
 * @returns The keys of the type.
 *
 * @internal
 */
type Keys<T> = T extends Any ? Extract<keyof T, string> : never;

/**
 * Merges the values of a property in a type.
 *
 * @typeParam T - The type to merge the values from.
 * @typeParam K - The key to merge the values from.
 * @returns The merged values.
 *
 * @internal
 */
type MergeValues<T, K extends PropertyKey> = T extends Any ? (K extends keyof T ? T[K] : never)
  : never;

/**
 * Checks if a type is a union that contains at least one plain object.
 *
 * @typeParam T - The type to check.
 * @returns True if the type is a union containing plain objects.
 *
 * @internal
 */
type IsUnionOfPlainObjects<T> = OnlyObjects<T> extends never ? false : true;

/**
 * Deeply merges the values of a property in a type.
 * If the merged value is a union of plain objects, it recursively merges them.
 * Removes undefined from the resulting type.
 *
 * @typeParam T - The type to merge the values from.
 * @typeParam K - The key to merge the values from.
 * @returns The deeply merged values with undefined removed.
 *
 * @internal
 */
type DeepMergeValues<T, K extends PropertyKey> = MergeValues<T, K> extends infer V
  ? IsUnionOfPlainObjects<V> extends true ? MergeUnion<V>
  : V
  : never;

/**
 * Merges a union type into a single type.
 * Preserves readonly modifiers per property and removes never values.
 * Recursively merges nested objects.
 * See {@link RemoveNevers} for more information.
 *
 * @typeParam T - The type to merge.
 * @typeParam P - Whether to make the merged type partial.
 *
 * @public
 */
type MergeUnion<T, P extends boolean = true> = Pretty<
  RemoveUndefined<
    RemoveNevers<
      P extends true ? Partial<
          {
            [K in Keys<OnlyObjects<T>>]: DeepMergeValues<OnlyObjects<T>, K>;
          }
        >
        : {
          [K in Keys<OnlyObjects<T>>]: DeepMergeValues<OnlyObjects<T>, K>;
        }
    >
  >
>;

/**
 * Flattens an array type.
 *
 * @typeParam T - The type to flatten.
 * @returns The flattened type.
 *
 * @public
 */
type FlatArray<T> = T extends Array<infer U> ? U : T;

/**
 * Helper type to make fields with undefined optional, preserving property order.
 *
 * This approach uses a combination of Omit and Partial to avoid property reordering
 * that can occur with intersection types.
 *
 * @typeParam T - The type to convert.
 * @returns The type with optional fields, maintaining property order.
 *
 * @internal
 */
type UndefToOptional<T> = Prettify<
  & Omit<T, { [K in keyof T]: undefined extends T[K] ? K : never }[keyof T]>
  & Partial<Pick<T, { [K in keyof T]: undefined extends T[K] ? K : never }[keyof T]>>
>;

/**
 * Sets the promise type of a type.
 *
 * @typeParam T - The type to set the promise type of.
 * @typeParam Async - Whether the type is async.
 * @returns The type with the promise type set.
 *
 * @public
 */
type Promisify<T, Async extends boolean> = Async extends true
  ? (IsPromise<T> extends true ? T : Promise<T>)
  : (IsPromise<T> extends true ? Awaited<T> : T);

/**
 * Removes never values from a record type.
 *
 * @typeParam T - The type to remove never values from.
 * @returns The type with the never values removed.
 *
 * @public
 */
type RemoveNevers<T extends Record<string, Any>> = {
  [K in keyof T as T[K] extends never ? never : K]: T[K];
};

/**
 * Checks if a type is an empty object type.
 *
 * @typeParam T - The type to check.
 * @returns True if the type is an empty object.
 *
 * @internal
 */
type IsEmptyObject<T> = T extends object ? keyof T extends never ? true
  : false
  : false;

/**
 * Removes undefined and empty objects from a type recursively.
 * Removes properties that are only undefined, only empty objects, or undefined | empty object.
 * Removes undefined from unions.
 * Applies recursively to nested objects.
 *
 * @typeParam T - The type to remove undefined and empty objects from.
 * @returns The type with undefined and empty objects removed recursively.
 *
 * @public
 */
type RemoveUndefined<T> = T extends readonly Any[] ? T
  : T extends object
    ? RemoveUndefinedHelper<T> extends infer R ? IsEmptyObject<R> extends true ? never
      : R
    : never
  : Exclude<T, undefined>;

/**
 * Helper type for RemoveUndefined that processes object properties.
 *
 * @typeParam T - The object type to process.
 * @returns The processed object type.
 *
 * @internal
 */
type RemoveUndefinedHelper<T extends object> = Pretty<
  {
    [
      K in keyof T as T[K] extends undefined ? never
        : [Exclude<T[K], undefined>] extends [never] ? never
        : IsEmptyObject<Exclude<T[K], undefined>> extends true ? never
        : ProcessedUndefined<T[K]> extends never ? never
        : K
    ]: ProcessedUndefined<T[K]>;
  }
>;

/**
 * Processes a value by removing undefined and applying RemoveUndefined recursively.
 * Returns never if the result is an empty object.
 *
 * @typeParam V - The value type to process.
 * @returns The processed value, or never if it's an empty object.
 *
 * @internal
 */
type ProcessedUndefined<V> = Exclude<V, undefined> extends infer U
  ? U extends object ? RemoveUndefined<U> extends infer R ? IsEmptyObject<R> extends true ? never
      : R
    : never
  : U
  : never;

/**
 * Creates a type that requires at least one property from the given type to be present.
 *
 * This utility type is useful when you need to ensure that at least one property in an object
 * is set, while others remain optional. For example, when picking fields from a schema where
 * you need to specify at least one field to pick.
 *
 * @typeParam T - The type from which at least one property is required.
 * @returns A type that requires at least one property from T.
 *
 * @public
 */
type RequireAtLeastOne<T> = {
  [K in keyof T]: Pick<T, K> & Partial<Pick<T, Exclude<keyof T, K>>>;
}[keyof T];

/**
 * Helper type to convert a union of object types to an intersection.
 * This merges all port records into a single flat object type.
 *
 * @typeParam U - The union type to convert.
 *
 * @internal
 */
type UnionToIntersection<U> = (U extends Any ? (k: U) => void : never) extends (
  k: infer I,
) => void ? I
  : never;

/**
 * Opaque is a type that makes a type opaque, preventing it from being widened.
 *
 * @typeParam T - The type to make opaque.
 * @returns The opaque type.
 *
 * @public
 */
type Opaque<T> = T & { readonly __opaque__: unique symbol };

/**
 * Obtain the instance type of a class.
 *
 * @remarks
 * This ensure that the instance type is not widened and is exactly the same as the class type.
 * See {@link Opaque} for more information.
 *
 * @typeParam T - The class to obtain the instance type of.
 * @returns The instance type of the class.
 *
 * @public
 */
type InstanceClass<T extends new (...args: Any[]) => Any> = Opaque<InstanceType<T>>;

/**
 * Filters out empty object types from a union type.
 *
 * @typeParam T - The union type to filter.
 *
 * @public
 */
type FilterEmptyObjects<T> = T extends Any ? T extends Record<PropertyKey, never> ? never : T
  : never;

/**
 * Gets the last element of a union type.
 *
 * @typeParam U - The union type to get the last element from.
 * @returns The last element of the union type.
 *
 * @internal
 */
type LastOf<U> = UnionToIntersection<U extends Any ? (x: U) => void : never> extends
  (x: infer L) => void ? L : never;

/**
 * Converts a union type to a tuple.
 *
 * @typeParam U - The union type to convert.
 * @returns The tuple type.
 *
 * @public
 */
type UnionToTuple<U, R extends Any[] = []> = [U] extends [never] ? R
  : UnionToTuple<Exclude<U, LastOf<U>>, [LastOf<U>, ...R]>;

/**
 * Gets the first key of a type.
 *
 * @typeParam T - The type to get the first key from.
 * @returns The first key of the type.
 *
 * @public
 */
type FirstKey<T> = UnionToTuple<keyof T> extends [infer F, ...Any] ? F : never;

/**
 * Gets the last key of a type.
 *
 * @typeParam T - The type to get the last key from.
 * @returns The last key of the type.
 *
 * @public
 */
type LastKey<T> = UnionToTuple<keyof T> extends [...Any, infer L] ? L : never;

/**
 * Gets the first element of a type.
 *
 * @typeParam T - The type to get the first element from.
 * @returns The first element of the type.
 *
 * @public
 */
type FirstElement<T> = FirstKey<T> extends keyof T ? T[FirstKey<T>] : never;

/**
 * Gets the last element of a type.
 *
 * @typeParam T - The type to get the last element from.
 * @returns The last element of the type.
 *
 * @public
 */
type LastElement<T> = LastKey<T> extends keyof T ? T[LastKey<T>] : never;

/**
 * Removes a prefix from a string type.
 *
 * @typeParam T - The type to remove the prefix from.
 * @typeParam P - The prefix to remove.
 * @returns The type with the prefix removed.
 *
 * @public
 */
type RemovePrefix<T, P extends string> = T extends `${P}${infer R}` ? R : T;

export type {
  Any,
  DeepAwaited,
  Equal,
  FilterEmptyObjects,
  FirstElement,
  FirstKey,
  FlatArray,
  HasPromise,
  IfReadonly,
  InstanceClass,
  IsPrimitive,
  IsPromise,
  LastElement,
  LastKey,
  Literal,
  MergeUnion,
  Opaque,
  PreserveReadonly,
  Prettify,
  Pretty,
  PrimitiveType,
  PrimitiveTypeExtended,
  Promisify,
  RemoveNevers,
  RemovePrefix,
  RemoveUndefined,
  RequireAtLeastOne,
  UndefToOptional,
  UnionKeys,
  UnionToIntersection,
  UnionToTuple,
};
