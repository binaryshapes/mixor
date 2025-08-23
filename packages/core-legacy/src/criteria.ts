/*
 * This file is part of the Mixor project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { type Component, component } from './component';
import type { Any } from './generics';
import { panic } from './panic';

/**
 * Represents the basic scalar types that can be used in criteria operations.
 * These types support direct comparison and filtering operations.
 *
 * @internal
 */
type Scalar = string | number | boolean | Date | bigint;

/**
 * Defines operators available for string field criteria.
 * Provides various string comparison and pattern matching operations.
 *
 * @internal
 */
type StringOperators = {
  /** Exact string equality. */
  $eq?: string;
  /** String inequality. */
  $ne?: string;
  /** String is in the provided array. */
  $in?: string[];
  /** String is not in the provided array. */
  $nin?: string[];
  /** String contains the specified substring. */
  $contains?: string;
  /** String starts with the specified prefix. */
  $startsWith?: string;
  /** String ends with the specified suffix. */
  $endsWith?: string;
  /** String matches the specified pattern (SQL-like). */
  $like?: string;
  /** String matches the specified regular expression. */
  $regex?: string;
};

/**
 * Defines operators available for number field criteria.
 * Provides various numerical comparison operations.
 *
 * @internal
 */
type NumberOperators = {
  /** Exact number equality. */
  $eq?: number;
  /** Number inequality. */
  $ne?: number;
  /** Number is greater than the specified value. */
  $gt?: number;
  /** Number is less than the specified value. */
  $lt?: number;
  /** Number is greater than or equal to the specified value. */
  $gte?: number;
  /** Number is less than or equal to the specified value. */
  $lte?: number;
  /** Number is in the provided array. */
  $in?: number[];
  /** Number is not in the provided array. */
  $nin?: number[];
};

/**
 * Defines operators available for boolean field criteria.
 * Provides boolean comparison operations.
 *
 * @internal
 */
type BooleanOperators = {
  /** Exact boolean equality. */
  $eq?: boolean;
  /** Boolean inequality. */
  $ne?: boolean;
};

/**
 * Defines operators available for Date field criteria.
 * Provides various date comparison operations.
 *
 * @internal
 */
type DateOperators = {
  /** Exact date equality. */
  $eq?: Date;
  /** Date inequality. */
  $ne?: Date;
  /** Date is after the specified date. */
  $gt?: Date;
  /** Date is before the specified date. */
  $lt?: Date;
  /** Date is after or equal to the specified date. */
  $gte?: Date;
  /** Date is before or equal to the specified date. */
  $lte?: Date;
  /** Date is in the provided array. */
  $in?: Date[];
  /** Date is not in the provided array. */
  $nin?: Date[];
};

/**
 * Defines operators available for bigint field criteria.
 * Provides various bigint comparison operations.
 *
 * @internal
 */
type BigIntOperators = {
  /** Exact bigint equality. */
  $eq?: bigint;
  /** Bigint inequality. */
  $ne?: bigint;
  /** Bigint is greater than the specified value. */
  $gt?: bigint;
  /** Bigint is less than the specified value. */
  $lt?: bigint;
  /** Bigint is greater than or equal to the specified value. */
  $gte?: bigint;
  /** Bigint is less than or equal to the specified value. */
  $lte?: bigint;
  /** Bigint is in the provided array. */
  $in?: bigint[];
  /** Bigint is not in the provided array. */
  $nin?: bigint[];
};

/**
 * Defines operators available for array field criteria.
 * Provides array-specific comparison and containment operations.
 *
 * @typeParam T - The scalar type of array elements.
 *
 * @internal
 */
type ArrayOperators<T extends Scalar> = {
  /** Array contains the specified element. */
  $contains?: T;
  /** Array contains any of the specified elements. */
  $containsAny?: T[];
  /** Array contains all of the specified elements. */
  $containsAll?: T[];
  /** Array length comparison using number operators. */
  $length?: NumberOperators;
};

/**
 * Infers the appropriate operators type based on the field type.
 * Maps each scalar type to its corresponding operators interface.
 *
 * @typeParam T - The field type to infer operators for.
 *
 * @internal
 */
type InferOperators<T> = T extends string
  ? StringOperators
  : T extends number
    ? NumberOperators
    : T extends boolean
      ? BooleanOperators
      : T extends Date
        ? DateOperators
        : T extends bigint
          ? BigIntOperators
          : T extends (infer U)[]
            ? U extends Scalar
              ? ArrayOperators<U>
              : never
            : never;

/**
 * Represents a field criteria that can be either a direct value or an operators object.
 * Used to define criteria for individual fields in a type.
 *
 * @typeParam T - The field type.
 *
 * @internal
 */
type FieldCriteria<T> = T | InferOperators<T>;

/**
 * Extracts fields from a type that can be used in criteria operations.
 * Only includes fields that are scalar types or arrays of scalar types.
 *
 * @typeParam T - The type to extract filterable fields from.
 *
 * @internal
 */
type FilterableFields<T> = {
  [K in keyof T as T[K] extends Scalar | Scalar[] ? K : never]: T[K];
};

/**
 * Represents a complete criteria object that can be used for filtering.
 * Combines field-specific criteria with logical operators for complex queries.
 * This type is flexible and accepts both CriteriaLogic and Criteria objects.
 *
 * @typeParam T - The type that the criteria operates on.
 *
 * @internal
 */
type CriteriaLogic<T> =
  | (Partial<{ [K in keyof FilterableFields<T>]: FieldCriteria<FilterableFields<T>[K]> }> &
      LogicalOperators<FilterableFields<T>>)
  | LogicalOperators<FilterableFields<T>>;

/**
 * A more flexible criteria type that accepts both CriteriaLogic and Criteria objects.
 * This allows for easier composition without type errors.
 *
 * @typeParam T - The type that the criteria operates on.
 *
 * @internal
 */
type FlexibleCriteria<T> = CriteriaLogic<T> | Criteria<T>;

/**
 * Defines logical operators for combining multiple criteria.
 * Provides AND, OR, and NOT operations for criteria composition.
 * Now accepts both CriteriaLogic and Criteria objects for flexibility.
 *
 * @typeParam T - The type that criteria operate on.
 *
 * @internal
 */
type LogicalOperators<T> = {
  /** Combines multiple criteria with AND logic. */
  $and?: FlexibleCriteria<T>[];
  /** Combines multiple criteria with OR logic. */
  $or?: FlexibleCriteria<T>[];
  /** Negates a single criteria. */
  $not?: FlexibleCriteria<T>;
};

/**
 * Builder interface for composing criteria.
 * Provides a fluent API for combining criteria with logical operators.
 *
 * @public
 */
type Criteria<T> = Component<
  'Criteria',
  {
    value: CriteriaLogic<T>;
  }
>;

/**
 * Criteria module error.
 *
 * @public
 */
const CriteriaError = panic<'Criteria', 'InvalidCriteria'>('Criteria');

/**
 * Checks if the criteria definition is valid.
 *
 * @param criteria - The criteria definition to check.
 *
 * @internal
 */
const checkCriteriaLogic = (criteria: CriteriaLogic<Any>) => {
  // TODO: This check must be more robust! Need to check every property inside the criteria logic.
  if (
    // Not defined.
    !criteria ||
    // Not an object.
    typeof criteria !== 'object' ||
    // Array.
    Array.isArray(criteria) ||
    // Empty object.
    Object.entries(criteria).length === 0
  ) {
    throw new CriteriaError('InvalidCriteria', 'The criteria definition is invalid.');
  }
};

/**
 * Creates a criteria object that can accept both Criteria and CriteriaLogic directly.
 * This function is intelligent and automatically extracts values from Criteria objects.
 *
 * @param criteriaDefinition - The criteria definition that can include Criteria objects.
 * @returns A Criteria object.
 *
 * @public
 */
function criteria<T>(criteriaDefinition: FlexibleCriteria<T>): Criteria<T> {
  const processCriteria = (
    criteria: FlexibleCriteria<T>,
  ): { value: CriteriaLogic<T>; children: Component<Any, Any>[] } => {
    // Check if the criteria definition is valid.
    checkCriteriaLogic(criteria);

    // If it's a Criteria object, extract its value and collect the component.
    if ('info' in criteria) {
      return { value: criteria.value, children: [criteria] };
    }

    // If it has logical operators, process them recursively.
    if ('$and' in criteria && criteria.$and) {
      const processed = criteria.$and.map((c) => processCriteria(c));
      const value = { $and: processed.map((p) => p.value) };
      const children = processed.flatMap((p) => p.children);
      return { value, children };
    }

    if ('$or' in criteria && criteria.$or) {
      const processed = criteria.$or.map((c) => processCriteria(c));
      const value = { $or: processed.map((p) => p.value) };
      const children = processed.flatMap((p) => p.children);
      return { value, children };
    }

    if ('$not' in criteria && criteria.$not) {
      const processed = processCriteria(criteria.$not);
      const value = { $not: processed.value };
      const children = processed.children;
      return { value, children };
    }

    // For other properties, return as is (field criteria).
    return { value: criteria as CriteriaLogic<T>, children: [] };
  };

  const { value, children } = processCriteria(criteriaDefinition);

  // Create the component.
  const criteriaComponent = component('Criteria', {
    value,
  }) as Criteria<T>;

  // Add children if any exist.
  if (children.length > 0) {
    criteriaComponent.addChildren(...children);
  }

  return criteriaComponent;
}

export type { Criteria, CriteriaError };
export { criteria };
