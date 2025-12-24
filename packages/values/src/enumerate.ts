/**
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { rule, type Value, value } from '@nuxo/components';
import { n } from '@nuxo/core';

/**
 * Panic error for the enumerate module.
 *
 * - EmptyEnumError: The enumeration is empty.
 * - DuplicateValuesError: The enumeration has duplicate values.
 * - MixedTypesError: The enumeration has mixed types.
 *
 * @public
 */
class EnumeratePanic extends n.panic<
  'Enumerate',
  'EmptyEnumError' | 'DuplicateValuesError' | 'MixedTypesError'
>('Enumerate') {}

/**
 * Invalid enum failure.
 *
 * @internal
 */
class InvalidEnum extends n.failure(
  'Enumerate.InvalidEnum',
  {
    'en-US': 'Only the following values are allowed: {{allowedValues | string}}.',
    'es-ES': 'Solo los siguientes valores son permitidos: {{allowedValues | string}}.',
  },
) {}

// Apply metadata to the InvalidEnum failure.
n.info(InvalidEnum)
  .doc({
    title: 'InvalidEnum Failure',
    body: 'A failure that is returned when the value is not in the enumeration.',
  });

/**
 * Interface for the enumerate factory function.
 * Supports both array-based and enum-based enumerations.
 *
 * @public
 */
interface EnumerateFactory {
  /**
   * Creates an enumeration value from a TypeScript enum.
   * The value ensures all values are of the same type (string) and unique.
   *
   * @param enumObj - TypeScript enum object.
   * @returns A value component that validates if a value is in the enumeration.
   * @throws A {@link EnumerateError} when the enumeration definition is invalid.
   *
   * @public
   */
  <T extends Record<string, string | number>>(
    enumObj: T,
  ): Value<keyof T, InstanceType<typeof InvalidEnum>>;

  /**
   * Creates an enumeration value from an array of values.
   * The value ensures all values are of the same type (string) and unique.
   *
   * @param values - Array of valid enumeration values (strings only).
   * @returns A value component that validates if a value is in the enumeration.
   * @throws A {@link EnumerateError} when the enumeration definition is invalid.
   *
   * @public
   */
  <T extends string>(values: T[]): Value<T, InstanceType<typeof InvalidEnum>>;
}

/**
 * Internal function to extract and validate values from an array.
 *
 * @param values - Array of valid enumeration values.
 * @returns Validated array of values.
 * @throws A {@link EnumerateError} when the enumeration definition is invalid.
 *
 * @internal
 */
const validateEnumArray = <T extends string>(values: T[]) => {
  // Validate input: throw panic if enum is empty.
  if (values.length === 0) {
    throw new EnumeratePanic('EmptyEnumError', 'Enumeration cannot be empty');
  }

  // Validate input: throw panic if enum has duplicate values.
  const uniqueValues = new Set(values);
  if (uniqueValues.size !== values.length) {
    throw new EnumeratePanic(
      'DuplicateValuesError',
      'Enumeration cannot have duplicate values',
    );
  }

  // Validate input: throw panic if enum has mixed types.
  const firstValue = values[0];
  if (firstValue === undefined) {
    throw new EnumeratePanic('EmptyEnumError', 'Enumeration cannot be empty');
  }
  const firstType = typeof firstValue;
  const hasMixedTypes = values.some((value) => (typeof value) !== firstType);
  if (hasMixedTypes) {
    throw new EnumeratePanic('MixedTypesError', 'Enumeration cannot have mixed types');
  }

  return values;
};

/**
 * Internal function to extract and validate values from a TypeScript enum.
 *
 * @param enumObj - TypeScript enum object.
 * @returns Validated array of string values.
 * @throws A {@link EnumerateError} when the enumeration definition is invalid.
 *
 * @internal
 */
const extractEnumValues = <T extends Record<string, string | number>>(enumObj: T): string[] => {
  // Filter out numeric keys from the enum object to handle TypeScript's bidirectional behavior.
  // NOTE: This is a workaround to handle the fact that TypeScript enums can have numeric keys.
  // This is not a perfect solution, but it is the best we can do for now.
  const filteredEnum = Object.fromEntries(
    Object.entries(enumObj)
      .filter(([key]) => isNaN(Number(key)))
      .filter(([key]) => typeof key === 'string'),
  ) as T;

  return validateEnumArray(Object.keys(filteredEnum));
};

/**
 * Creates an enumeration rule from an array of allowed values.
 *
 * @param allowedValues - Array of allowed values.
 * @returns A rule that checks if the value is in the enumeration.
 *
 * @internal
 */
const EnumRule = <T extends string>(allowedValues: T[]) => {
  const IsEnum = rule(() =>
    n.assert(
      (value: T) => allowedValues.includes(value),
      new InvalidEnum({ allowedValues: allowedValues.join(', ') }),
    )
  );

  // Only set the type and doc if the type is not already set.
  if (!n.info(IsEnum).props.type) {
    n.info(IsEnum)
      .type({
        type: 'string',
        enum: allowedValues,
      })
      .params(['allowedValues', allowedValues.join(', ')])
      .doc({
        title: 'IsEnum',
        body: n.doc`
        A rule that checks if the value is in the enumeration. If the value is not in the
        enumeration, the rule will return the error code 'Enumerate.InvalidEnum'.
      `,
      });

    n.meta(IsEnum)
      .name('IsEnum')
      .describe('A rule that checks if the value is in the enumeration');
  }

  return IsEnum();
};

/**
 * Creates an enumerate value component that handles both arrays and enums.
 *
 * @remarks
 * This function creates a value component that validates if a value is in the enumeration.
 * It supports both array-based and enum-based enumerations. All values must be strings.
 *
 * @param allowedValues - Array of string values or TypeScript enum object.
 * @returns A value component that validates if a value is in the enumeration.
 * @throws A {@link EnumerateError} when the enumeration definition is invalid.
 *
 * @public
 */
const enumerate: EnumerateFactory = <T extends string[] | Record<string, string | number>>(
  allowedValues: T,
) => {
  const enumValue = Array.isArray(allowedValues)
    ? (value(EnumRule(validateEnumArray(allowedValues))) as unknown as Value<
      T,
      InstanceType<typeof InvalidEnum>
    >)
    : (value(EnumRule(extractEnumValues(allowedValues))) as unknown as Value<
      keyof T,
      InstanceType<typeof InvalidEnum>
    >);

  n.info(enumValue)
    .doc({
      title: 'Enumerate',
      body: n.doc`
      An enumeration is a value component that stores a single value from a list of fixed
      allowed values. All validations are performed against that list.
      `,
    });

  return enumValue;
};

export { enumerate, EnumeratePanic, InvalidEnum };
