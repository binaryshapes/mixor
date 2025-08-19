/*
 * This file is part of the Mixor project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { type Any, type ResultError, type Value, err, ok, panic, rule, value } from '@mixor/core';

/**
 * Panic error for the enumerate module.
 *
 * @public
 */
const EnumerateError = panic<
  'Enumerate',
  'EmptyEnumError' | 'DuplicateValuesError' | 'MixedTypesError'
>('Enumerate');

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
  <T extends Record<string, string | number>>(enumObj: T): Value<T[keyof T], InvalidEnum>;

  /**
   * Creates an enumeration validator from an array of values.
   * The validator ensures all values are of the same type (string or number) and unique.
   *
   * @param values - Array of valid enumeration values (strings or numbers only).
   * @returns A function that validates if a value is in the enumeration.
   * @throws A {@link EnumerateError} when the enumeration definition is invalid.
   */
  <T extends string | number, L = T>(values: T[]): Value<L, InvalidEnum>;
}

/**
 * Result error type related to the `enumerate` rule.
 *
 * @internal
 */
type InvalidEnum = ResultError<'InvalidEnum', 'EnumerateValue', 'create'>;

/**
 * Instance of the `InvalidEnum` error type.
 *
 * @internal
 */
const InvalidEnum: InvalidEnum = {
  code: 'InvalidEnum',
  context: 'EnumerateValue',
  origin: 'create',
  message: 'Value is not a valid enumeration value',
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
const enumerateArray = <T, L = T>(values: T[]): Value<L, InvalidEnum> => {
  // Validate input: throw panic if enum is empty.
  if (values.length === 0) {
    throw new EnumerateError('EmptyEnumError', 'Enumeration cannot be empty');
  }

  // Validate input: throw panic if enum has duplicate values.
  const uniqueValues = new Set(values);
  if (uniqueValues.size !== values.length) {
    throw new EnumerateError('DuplicateValuesError', 'Enumeration cannot have duplicate values');
  }

  // Validate input: throw panic if enum has mixed types.
  const firstType = typeof values[0];
  const hasMixedTypes = values.some((value) => typeof value !== firstType);
  if (hasMixedTypes) {
    throw new EnumerateError('MixedTypesError', 'Enumeration cannot have mixed types');
  }

  return value(
    rule((value: L) => {
      if (!values.includes(value as Any)) {
        return err(InvalidEnum);
      }
      return ok(value);
    }).subType('enum'),
  );
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
): Value<T[keyof T], InvalidEnum> => {
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
    throw new EnumerateError('EmptyEnumError', 'Enumeration cannot be empty');
  }

  const uniqueValues = new Set(values);
  if (uniqueValues.size !== values.length) {
    throw new EnumerateError('DuplicateValuesError', 'Enumeration cannot have duplicate values');
  }

  const firstType = typeof values[0];
  const hasMixedTypes = values.some((value) => typeof value !== firstType);
  if (hasMixedTypes) {
    throw new EnumerateError('MixedTypesError', 'Enumeration cannot have mixed types');
  }

  return value(
    rule((value: T[keyof T]) => {
      if (!values.includes(value as string | number)) {
        return err(InvalidEnum);
      }
      return ok(value);
    }).subType('enum'),
  );
};

/**
 * Implementation function that handles both arrays and enums.
 *
 * @param input - Array of values or TypeScript enum object.
 * @returns A function that validates if a value is in the enumeration.
 * @throws A {@link EnumerateError} when the enumeration definition is invalid.
 *
 * @public
 */
const enumerate: EnumerateFunction = (input: Any) =>
  (Array.isArray(input)
    ? enumerateArray(input as (string | number)[])
    : enumerateEnum(input as Record<string, string | number>)
  ).subType('enum');

export { enumerate, EnumerateError };
