/*
 * This file is part of the Mixor project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { Panic, type Result, err, ok } from '@mixor/core';

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
 * Creates an enumeration validator from an array of values.
 * The validator ensures all values are of the same type (string or number) and unique.
 *
 * @param values - Array of valid enumeration values (strings or numbers only).
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
 * @public
 */
const enumerate = <T extends string | number>(
  values: T[],
): ((value: T) => Result<T, 'INVALID_ENUM_VALUE'>) => {
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

  return (value: T) => {
    if (!values.includes(value)) {
      return err('INVALID_ENUM_VALUE');
    }
    return ok(value);
  };
};

export { enumerate, EnumerateError };
