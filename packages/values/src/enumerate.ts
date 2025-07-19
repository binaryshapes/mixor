/*
 * This file is part of the Mixor project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { type Any, type Literal, Panic, type Result, err, ok } from '@mixor/core';

/**
 * Error class for enumeration validation failures.
 * Thrown when the enumeration definition is invalid.
 *
 * @public
 */
class EnumerateError extends Panic<
  'ENUMERATE',
  // Error when the enum is empty
  | 'EMPTY_ENUM'
  // Error when the enum has duplicate values
  | 'DUPLICATE_VALUES'
  // Error when the enum has mixed types
  | 'MIXED_TYPES'
>('ENUMERATE') {}

/**
 * Interface for the enumerate function overloads.
 * Supports both array-based and enum-based enumerations.
 *
 * @public
 */
interface EnumerateFunction {
  /**
   * Creates an enumeration validator from a TypeScript enum.
   * The validator ensures all values are of the same type (string or number) and unique.
   *
   * @param enumObj - TypeScript enum object.
   * @returns A function that validates if a value is in the enumeration.
   * @throws A {@link EnumerateError} when the enumeration definition is invalid.
   */
  <T extends Record<string, string | number>>(
    enumObj: T,
  ): (value: T[keyof T]) => Result<T[keyof T], 'INVALID_ENUM_VALUE'>;

  /**
   * Creates an enumeration validator from an array of values.
   * The validator ensures all values are of the same type (string or number) and unique.
   *
   * @param values - Array of valid enumeration values (strings or numbers only).
   * @returns A function that validates if a value is in the enumeration.
   * @throws A {@link EnumerateError} when the enumeration definition is invalid.
   */
  <T extends string | number, L = Literal<T>>(
    values: T[],
  ): (value: L) => Result<L, 'INVALID_ENUM_VALUE'>;
}

/**
 * Implementation function that handles both arrays and enums.
 *
 * @param input - Array of values or TypeScript enum object.
 * @returns A function that validates if a value is in the enumeration.
 * @throws A {@link EnumerateError} when the enumeration definition is invalid.
 *
 * @example
 * ```ts
 * // enumerate-001: Basic string enumeration validation.
 * const status = enumerate(['active', 'inactive', 'pending']);
 * const result = status('active');
 * if (isOk(result)) {
 *   // unwrap(result): 'active'.
 * }
 * ```
 *
 * @example
 * ```ts
 * // enumerate-002: Number enumeration validation.
 * const priority = enumerate([1, 2, 3, 4, 5]);
 * const result = priority(3);
 * if (isOk(result)) {
 *   // unwrap(result): 3.
 * }
 * ```
 *
 * @example
 * ```ts
 * // enumerate-003: Invalid value handling.
 * const status = enumerate(['active', 'inactive']);
 * const result = status('deleted');
 * if (isErr(result)) {
 *   // unwrap(result): 'INVALID_ENUM_VALUE'.
 * }
 * ```
 *
 * @example
 * ```ts
 * // enumerate-004: Empty array validation.
 * try {
 *   enumerate([]);
 * } catch (error) {
 *   // error.message: 'Enumeration cannot be empty'.
 *   // error.key: 'ENUMERATE:EMPTY_ENUM'.
 * }
 * ```
 *
 * @example
 * ```ts
 * // enumerate-005: Duplicate values validation.
 * try {
 *   enumerate(['active', 'inactive', 'active']);
 * } catch (error) {
 *   // error.message: 'Enumeration cannot have duplicate values'.
 *   // error.key: 'ENUMERATE:DUPLICATE_VALUES'.
 * }
 * ```
 *
 * @example
 * ```ts
 * // enumerate-006: Mixed types validation.
 * try {
 *   enumerate(['active', 123]);
 * } catch (error) {
 *   // error.message: 'Enumeration cannot have mixed types'.
 *   // error.key: 'ENUMERATE:MIXED_TYPES'.
 * }
 * ```
 *
 * @example
 * ```ts
 * // enumerate-007: Using TypeScript string enum.
 * enum Status {
 *   ACTIVE = 'active',
 *   INACTIVE = 'inactive',
 *   PENDING = 'pending'
 * }
 * const status = enumerate(Status);
 * const result = status(Status.ACTIVE);
 * if (isOk(result)) {
 *   // unwrap(result): 'active'.
 * }
 * ```
 *
 * @example
 * ```ts
 * // enumerate-008: Using TypeScript numeric enum.
 * enum Priority {
 *   LOW = 1,
 *   MEDIUM = 2,
 *   HIGH = 3
 * }
 * const priority = enumerate(Priority);
 * const result = priority(Priority.MEDIUM);
 * if (isOk(result)) {
 *   // unwrap(result): 2.
 * }
 * ```
 *
 * @example
 * ```ts
 * // enumerate-009: Mixed types validation for enums.
 * try {
 *   enum MixedEnum {
 *     ACTIVE = 'active',
 *     LOW = 1
 *   }
 *   enumerate(MixedEnum);
 * } catch (error) {
 *   // error.message: 'Enumeration cannot have mixed types'.
 *   // error.key: 'ENUMERATE:MIXED_TYPES'.
 * }
 * ```
 *
 * @example
 * ```ts
 * // enumerate-010: Type inference preservation with value function.
 * const status = enumerate(['active', 'inactive', 'unverified']);
 * const statusValue = value(status);
 * // statusValue preserves the literal types: Value<"active" | "inactive" | "unverified", "INVALID_ENUM_VALUE">.
 * ```
 *
 * @public
 */
const enumerate: EnumerateFunction = <T extends Any>(input: T) => {
  // Detect if input is an array or enum object
  if (Array.isArray(input)) {
    return enumerateArray(input as (string | number)[]);
  } else {
    return enumerateEnum(input as Record<string, string | number>);
  }
};

/**
 * Internal function to handle array-based enumerations.
 *
 * @param values - Array of valid enumeration values.
 * @returns A function that validates if a value is in the enumeration.
 * @throws A {@link EnumerateError} when the enumeration definition is invalid.
 *
 * @internal
 */
const enumerateArray = <T, L = Literal<T>>(
  values: T[],
): ((value: L) => Result<L, 'INVALID_ENUM_VALUE'>) => {
  // Validate input: throw panic if enum is empty.
  if (values.length === 0) {
    throw new EnumerateError('EMPTY_ENUM', 'Enumeration cannot be empty');
  }

  // Validate input: throw panic if enum has duplicate values.
  const uniqueValues = new Set(values);
  if (uniqueValues.size !== values.length) {
    throw new EnumerateError('DUPLICATE_VALUES', 'Enumeration cannot have duplicate values');
  }

  // Validate input: throw panic if enum has mixed types.
  const firstType = typeof values[0];
  const hasMixedTypes = values.some((value) => typeof value !== firstType);
  if (hasMixedTypes) {
    throw new EnumerateError('MIXED_TYPES', 'Enumeration cannot have mixed types');
  }

  return (value: L) => {
    if (!values.includes(value as Any)) {
      return err('INVALID_ENUM_VALUE');
    }
    return ok(value);
  };
};

/**
 * Internal function to handle enum-based enumerations.
 *
 * @param enumObj - TypeScript enum object.
 * @returns A function that validates if a value is in the enumeration.
 * @throws A {@link EnumerateError} when the enumeration definition is invalid.
 *
 * @internal
 */
const enumerateEnum = <T extends Record<string, string | number>>(
  enumObj: T,
): ((value: T[keyof T]) => Result<T[keyof T], 'INVALID_ENUM_VALUE'>) => {
  // Filter out numeric keys from the enum object to handle TypeScript's bidirectional behavior.
  // NOTE: This is a workaround to handle the fact that TypeScript enums can have numeric keys.
  // This is not a perfect solution, but it is the best we can do for now.
  const filteredEnum = Object.fromEntries(
    Object.entries(enumObj).filter(([key]) => isNaN(Number(key))),
  ) as T;

  // Extract values from the filtered enum.
  const values = Object.values(filteredEnum).filter(
    (value) => typeof value === 'string' || typeof value === 'number',
  ) as (string | number)[];

  // Use the same validation logic as arrays.
  if (values.length === 0) {
    throw new EnumerateError('EMPTY_ENUM', 'Enumeration cannot be empty');
  }

  const uniqueValues = new Set(values);
  if (uniqueValues.size !== values.length) {
    throw new EnumerateError('DUPLICATE_VALUES', 'Enumeration cannot have duplicate values');
  }

  const firstType = typeof values[0];
  const hasMixedTypes = values.some((value) => typeof value !== firstType);
  if (hasMixedTypes) {
    throw new EnumerateError('MIXED_TYPES', 'Enumeration cannot have mixed types');
  }

  return (value: T[keyof T]) => {
    if (!values.includes(value as string | number)) {
      return err('INVALID_ENUM_VALUE');
    }
    return ok(value);
  };
};

export { enumerate, EnumerateError };
