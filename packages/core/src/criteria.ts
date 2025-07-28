/*
 * This file is part of the Mixor project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

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
 * Defines logical operators for combining multiple criteria.
 * Provides AND, OR, and NOT operations for criteria composition.
 *
 * @typeParam T - The type that criteria operate on.
 *
 * @internal
 */
type LogicalOperators<T> = {
  /** Combines multiple criteria with AND logic. */
  $and?: Criteria<T>[];
  /** Combines multiple criteria with OR logic. */
  $or?: Criteria<T>[];
  /** Negates a single criteria. */
  $not?: Criteria<T>;
};

/**
 * Represents a complete criteria object that can be used for filtering.
 * Combines field-specific criteria with logical operators for complex queries.
 *
 * @typeParam T - The type that the criteria operates on.
 *
 * @public
 */
type Criteria<T> =
  | (Partial<{ [K in keyof FilterableFields<T>]: FieldCriteria<FilterableFields<T>[K]> }> &
      LogicalOperators<FilterableFields<T>>)
  | LogicalOperators<FilterableFields<T>>;

/**
 * Builder interface for composing criteria.
 * Provides a fluent API for combining criteria with logical operators.
 *
 * @public
 */
interface CriteriaBuilder<T> {
  /**
   * Combines the current criteria with others using AND logic.
   *
   * @param others - Additional criteria to combine with AND.
   * @returns A new CriteriaBuilder with the combined criteria.
   *
   * @example
   * ```ts
   * // criteria-001: Basic AND composition.
   * const criteria = criteria<User>({ score: { $gte: 90 } })
   *   .and({ rating: { $gte: 4 } })
   *   .build();
   * ```
   */
  and(...others: Criteria<T>[]): CriteriaBuilder<T>;

  /**
   * Combines the current criteria with others using OR logic.
   *
   * @param others - Additional criteria to combine with OR.
   * @returns A new CriteriaBuilder with the combined criteria.
   *
   * @example
   * ```ts
   * // criteria-002: Basic OR composition.
   * const criteria = criteria<User>({ score: { $gte: 90 } })
   *   .or({ rating: { $gte: 4 } })
   *   .build();
   * ```
   */
  or(...others: Criteria<T>[]): CriteriaBuilder<T>;

  /**
   * Negates the current criteria.
   *
   * @returns A new CriteriaBuilder with the negated criteria.
   *
   * @example
   * ```ts
   * // criteria-003: Negating criteria.
   * const criteria = criteria<User>({ score: { $lt: 50 } })
   *   .not()
   *   .build();
   * ```
   */
  not(): CriteriaBuilder<T>;

  /**
   * Builds the final criteria object.
   *
   * @returns The composed criteria object.
   *
   * @example
   * ```ts
   * // criteria-004: Building final criteria.
   * const finalCriteria = criteria<User>({ score: { $gte: 90 } })
   *   .and({ rating: { $gte: 4 } })
   *   .build();
   * ```
   */
  build(): Criteria<T>;
}

/**
 * Creates a criteria builder for composing criteria objects.
 * This function provides a unified API for creating and composing criteria.
 *
 * @param criteriaDefinition - The initial criteria definition or existing criteria.
 * @returns A CriteriaBuilder for composing criteria.
 *
 * @example
 * ```ts
 * // criteria-001: Creating individual criteria.
 * const UserHasGreatScore = criteria<User>({
 *   score: { $gte: 90 },
 * }).build();
 * ```
 *
 * @example
 * ```ts
 * // criteria-002: Composing existing criteria.
 * const SelectedUserForContest = criteria(UserHasGreatScore)
 *   .and(criteria(UserIsEarlyAdopter).or(UserIsInvestor).build())
 *   .and(criteria(UserHasBadRating).not().build())
 *   .build();
 * ```
 *
 * @public
 */
function criteria<T>(criteriaDefinition: Criteria<T>): CriteriaBuilder<T> {
  return {
    and: (...others: Criteria<T>[]) => {
      const existingAnd = criteriaDefinition.$and ? criteriaDefinition.$and : [criteriaDefinition];
      const newAnds = others.flatMap((c) => (c.$and ? c.$and : [c]));
      return criteria<T>({
        $and: [...existingAnd, ...newAnds],
      });
    },
    or: (...others: Criteria<T>[]) => {
      const existingOr = criteriaDefinition.$or ? criteriaDefinition.$or : [criteriaDefinition];
      const newOrs = others.flatMap((c) => (c.$or ? c.$or : [c]));
      return criteria<T>({
        $or: [...existingOr, ...newOrs],
      });
    },
    not: () => criteria<T>({ $not: criteriaDefinition }),
    build: () => criteriaDefinition,
  };
}

export type { Criteria, CriteriaBuilder };
export { criteria };
