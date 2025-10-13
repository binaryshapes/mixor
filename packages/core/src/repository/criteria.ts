/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type Component, component, Panic } from '../system/index';
import type { Any } from '../utils';

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
type InferOperators<T> = T extends string ? StringOperators
  : T extends number ? NumberOperators
  : T extends boolean ? BooleanOperators
  : T extends Date ? DateOperators
  : T extends bigint ? BigIntOperators
  : T extends (infer U)[] ? U extends Scalar ? ArrayOperators<U>
    : never
  : never;

/**
 * Union type of all possible operator names based on field type.
 * Provides exhaustive operator support for each field type.
 *
 * @typeParam T - The field type to get operators for.
 *
 * @internal
 */
type OperatorNames<T> = T extends string ? keyof StringOperators
  : T extends number ? keyof NumberOperators
  : T extends boolean ? keyof BooleanOperators
  : T extends Date ? keyof DateOperators
  : T extends bigint ? keyof BigIntOperators
  : T extends (infer U)[] ? U extends Scalar ? keyof ArrayOperators<U>
    : never
  : never;

/**
 * Gets the value type for a specific operator on a field type.
 * Provides type safety for operator values.
 *
 * @typeParam T - The field type.
 * @typeParam O - The operator name.
 *
 * @internal
 */
type OperatorValue<T, O extends OperatorNames<T>> = T extends string
  ? O extends keyof StringOperators ? StringOperators[O]
  : never
  : T extends number ? O extends keyof NumberOperators ? NumberOperators[O]
    : never
  : T extends boolean ? O extends keyof BooleanOperators ? BooleanOperators[O]
    : never
  : T extends Date ? O extends keyof DateOperators ? DateOperators[O]
    : never
  : T extends bigint ? O extends keyof BigIntOperators ? BigIntOperators[O]
    : never
  : T extends (infer U)[]
    ? U extends Scalar ? O extends keyof ArrayOperators<U> ? ArrayOperators<U>[O]
      : never
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
  | (
    & Partial<{ [K in keyof FilterableFields<T>]: FieldCriteria<FilterableFields<T>[K]> }>
    & LogicalOperators<FilterableFields<T>>
  )
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
type Criteria<T, Args extends Any[] = never[]> = Component<
  'Criteria',
  & {
    value: CriteriaLogic<T>;
  }
  & ((...args: Args) => Criteria<T>)
  & {
    /**
     * Combines this criteria with another criteria using AND logic.
     * @param other - The other criteria to combine with.
     * @param argsSplitter - Optional function that splits combined args into separate args for each criteria.
     * @returns A new criteria that represents the AND combination.
     */
    and<Args2 extends Any[], CombinedArgs extends Any[] = [...Args, ...Args2]>(
      other: Criteria<T, Args2>,
      argsSplitter?: (args: CombinedArgs) => { first: Args; second: Args2 },
    ): Criteria<T, CombinedArgs>;

    /**
     * Combines this criteria with another criteria using OR logic.
     * @param other - The other criteria to combine with.
     * @param argsSplitter - Optional function that splits combined args into separate args for each criteria.
     * @returns A new criteria that represents the OR combination.
     */
    or<Args2 extends Any[], CombinedArgs extends Any[] = [...Args, ...Args2]>(
      other: Criteria<T, Args2>,
      argsSplitter?: (args: CombinedArgs) => { first: Args; second: Args2 },
    ): Criteria<T, CombinedArgs>;

    /**
     * Negates this criteria using NOT logic.
     * @returns A new criteria that represents the negation.
     */
    not(): Criteria<T, Args>;
  }
>;

/**
 * Criteria module error.
 *
 * - InvalidCriteria: The criteria definition is invalid.
 *
 * @public
 */
class CriteriaError extends Panic<'Criteria', 'InvalidCriteria'>('Criteria') {}

/**
 * Builder class for composing criteria with a simple and type-safe API.
 * Provides a unified `when` method that handles all field types and operators.
 *
 * @typeParam T - The type that the criteria operates on.
 *
 * @public
 */
class Logic<TT extends { Type: Any; Tag: 'Schema' }, T = TT['Type']> {
  public criteria: CriteriaLogic<T> = {};

  public constructor(private readonly schema: TT) {}

  /**
   * Adds a field criteria with a specific operator.
   * This method provides exhaustive type safety for all field types and their operators.
   *
   * @param field - The field name.
   * @param operator - The operator to use (type-safe based on field type).
   * @param value - The value for the operator (type-safe based on operator).
   * @returns This builder instance for method chaining.
   */
  when<K extends keyof FilterableFields<T>, O extends OperatorNames<FilterableFields<T>[K]>>(
    field: K,
    operator: O,
    value: OperatorValue<FilterableFields<T>[K], O>,
  ): this {
    this.criteria = { ...this.criteria, [field]: { [operator]: value } };
    checkCriteriaLogic(this.criteria);
    return this;
  }

  as(criteria: FlexibleCriteria<T>): this {
    this.criteria = criteria as CriteriaLogic<T>;
    checkCriteriaLogic(this.criteria);
    return this;
  }

  /**
   * Adds an AND condition with multiple criteria.
   * @param criteria - Array of criteria to combine with AND logic.
   * @returns This builder instance for method chaining.
   */
  $and(criteria: FlexibleCriteria<T>[]): this {
    this.criteria = { ...this.criteria, $and: criteria };
    return this;
  }

  /**
   * Adds an OR condition with multiple criteria.
   * @param criteria - Array of criteria to combine with OR logic.
   * @returns This builder instance for method chaining.
   */
  $or(criteria: FlexibleCriteria<T>[]): this {
    this.criteria = { ...this.criteria, $or: criteria };
    return this;
  }

  /**
   * Adds a NOT condition that negates a criteria.
   * @param criteria - The criteria to negate.
   * @returns This builder instance for method chaining.
   */
  $not(criteria: FlexibleCriteria<T>): this {
    this.criteria = { ...this.criteria, $not: criteria };
    return this;
  }
}

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
    throw new CriteriaError('InvalidCriteria', 'The criteria definition is invalid');
  }
};

/**
 * Creates a new CriteriaBuilder instance for fluent criteria composition.
 * @returns A new CriteriaBuilder instance.
 * @public
 */
function logic<TT extends { Type: Any; Tag: 'Schema' }>(
  schema: TT,
) {
  type T = TT['Type'];
  return new Logic<TT, T>(schema);
}

type CriteriaConstructor<Params extends Any[], S extends { Type: Any; Tag: 'Schema' }> = (
  ...params: Params
) => Logic<S, S['Type']>;

function criteria<Params extends Any[], S extends { Type: Any; Tag: 'Schema' }>(
  constructor: CriteriaConstructor<Params, S>,
) {
  const criteriaFn = (...args: Params) => {
    const criteriaValue = constructor(...args).criteria;
    return { value: criteriaValue };
  };

  // Add composition methods to the criteria function itself
  const criteriaWithComposition = Object.assign(criteriaFn, {
    and<Args2 extends Any[], CombinedArgs extends Any[] = [...Params, ...Args2]>(
      other: Criteria<S['Type'], Args2>,
      argsSplitter?: (args: CombinedArgs) => { first: Params; second: Args2 },
    ) {
      return criteria((...combinedArgs: CombinedArgs) => {
        let firstArgs: Params;
        let secondArgs: Args2;

        if (argsSplitter) {
          // Use custom argsSplitter
          const split = argsSplitter(combinedArgs);
          firstArgs = split.first;
          secondArgs = split.second;
        } else {
          // For backward compatibility, we'll use a simple approach
          // This is a limitation - we can't determine Params.length at runtime
          throw new Error(
            'argsSplitter is required for criteria with parameters. Use andCriteria/orCriteria helper functions instead.',
          );
        }

        const firstCriteria = constructor(...firstArgs).criteria;
        const secondCriteria = other(...secondArgs).value;

        // Create a new Logic instance with the same schema
        const firstLogic = constructor(...firstArgs);
        return firstLogic.as({ $and: [firstCriteria, secondCriteria] });
      });
    },

    or<Args2 extends Any[], CombinedArgs extends Any[] = [...Params, ...Args2]>(
      other: Criteria<S['Type'], Args2>,
      argsSplitter?: (args: CombinedArgs) => { first: Params; second: Args2 },
    ) {
      return criteria((...combinedArgs: CombinedArgs) => {
        let firstArgs: Params;
        let secondArgs: Args2;

        if (argsSplitter) {
          // Use custom argsSplitter
          const split = argsSplitter(combinedArgs);
          firstArgs = split.first;
          secondArgs = split.second;
        } else {
          // For backward compatibility, we'll use a simple approach
          // This is a limitation - we can't determine Params.length at runtime
          throw new Error(
            'argsSplitter is required for criteria with parameters. Use andCriteria/orCriteria helper functions instead.',
          );
        }

        const firstCriteria = constructor(...firstArgs).criteria;
        const secondCriteria = other(...secondArgs).value;

        // Create a new Logic instance with the same schema
        const firstLogic = constructor(...firstArgs);
        return firstLogic.as({ $or: [firstCriteria, secondCriteria] });
      });
    },

    not() {
      return criteria((...args: Params) => {
        const criteriaValue = constructor(...args).criteria;
        const logicInstance = constructor(...args);
        return logicInstance.as({ $not: criteriaValue });
      });
    },
  });

  return component('Criteria', criteriaWithComposition, { constructor }) as unknown as Criteria<
    S['Type'],
    Params
  >;
}

/**
 * Helper function to create a criteria that combines two criteria with AND logic.
 * The argument combination is handled automatically based on the criteria signatures.
 *
 * @param schema - The schema to use for the combined criteria.
 * @param first - The first criteria.
 * @param second - The second criteria.
 * @returns A new criteria that represents the AND combination.
 *
 * @public
 */
function andCriteria<T, Args1 extends Any[], Args2 extends Any[]>(
  schema: { Type: T; Tag: 'Schema' },
  first: Criteria<T, Args1>,
  second: Criteria<T, Args2>,
): Criteria<T, [...Args1, ...Args2]> {
  return criteria((...combinedArgs: [...Args1, ...Args2]) => {
    // Try to determine the split point by testing the criteria.
    let firstArgs: Args1;
    let secondArgs: Args2;

    // For now, we'll use a simple heuristic:
    // - If first criteria takes 1 arg and second takes 0, split at 1.
    // - If both take 1 arg, split at 1 (first gets first arg, second gets second).
    // This is a limitation, but covers the most common cases.

    if (combinedArgs.length === 1) {
      // Case: first takes 1 arg, second takes 0 args.
      firstArgs = combinedArgs as unknown as Args1;
      secondArgs = [] as unknown as Args2;
    } else if (combinedArgs.length === 2) {
      // Case: both take 1 arg each.
      firstArgs = [combinedArgs[0]] as Args1;
      secondArgs = [combinedArgs[1]] as Args2;
    } else {
      // Fallback: assume first takes all args except the last
      firstArgs = combinedArgs.slice(0, -1) as Args1;
      secondArgs = combinedArgs.slice(-1) as Args2;
    }

    const firstCriteria = first(...firstArgs).value;
    const secondCriteria = second(...secondArgs).value;

    return logic(schema).as({ $and: [firstCriteria, secondCriteria] });
  });
}

/**
 * Helper function to create a criteria that combines two criteria with OR logic.
 * The argument combination is handled automatically based on the criteria signatures.
 *
 * @param schema - The schema to use for the combined criteria.
 * @param first - The first criteria.
 * @param second - The second criteria.
 * @returns A new criteria that represents the OR combination.
 *
 * @public
 */
function orCriteria<T, Args1 extends Any[], Args2 extends Any[]>(
  schema: { Type: T; Tag: 'Schema' },
  first: Criteria<T, Args1>,
  second: Criteria<T, Args2>,
): Criteria<T, [...Args1, ...Args2]> {
  return criteria((...combinedArgs: [...Args1, ...Args2]) => {
    // Try to determine the split point by testing the criteria
    let firstArgs: Args1;
    let secondArgs: Args2;

    // For now, we'll use a simple heuristic:
    // - If first criteria takes 1 arg and second takes 0, split at 1
    // - If both take 1 arg, split at 1 (first gets first arg, second gets second)
    // This is a limitation, but covers the most common cases

    if (combinedArgs.length === 1) {
      // Case: first takes 1 arg, second takes 0 args
      firstArgs = combinedArgs as unknown as Args1;
      secondArgs = [] as unknown as Args2;
    } else if (combinedArgs.length === 2) {
      // Case: both take 1 arg each
      firstArgs = [combinedArgs[0]] as Args1;
      secondArgs = [combinedArgs[1]] as Args2;
    } else {
      // Fallback: assume first takes all args except the last
      firstArgs = combinedArgs.slice(0, -1) as Args1;
      secondArgs = combinedArgs.slice(-1) as Args2;
    }

    const firstCriteria = first(...firstArgs).value;
    const secondCriteria = second(...secondArgs).value;

    return logic(schema).as({ $or: [firstCriteria, secondCriteria] });
  });
}

export { andCriteria, criteria, CriteriaError, logic, orCriteria };
export type { Criteria };
