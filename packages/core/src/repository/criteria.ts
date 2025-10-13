/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type Component, component } from '../system';
import { type Any } from '../utils';

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
 *
 * @typeParam T - The type that the criteria operates on.
 *
 * @internal
 */
type CriteriaLogic<T> =
  | (
    & Partial<{ [K in keyof FilterableFields<T>]: FieldCriteria<FilterableFields<T>[K]> }>
    & LogicalOperators<T>
  )
  | LogicalOperators<T>;

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
  $and?: CriteriaLogic<T>[];
  /** Combines multiple criteria with OR logic. */
  $or?: CriteriaLogic<T>[];
  /** Negates a single criteria. */
  $not?: CriteriaLogic<T>;
};

/**
 * Criteria schema type.
 *
 * @internal
 */
type CriteriaSchema = { Type: Any; Tag: 'Schema' };

/**
 * Criteria constructor type.
 *
 * @typeParam Params - The parameters for the criteria.
 * @typeParam S - The schema type.
 *
 * @internal
 */
type CriteriaConstructor<Params extends Any[], S extends CriteriaSchema> = (
  ...params: Params
) => Logic<S, S['Type']>;

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
  & Pick<CriteriaComposer<T, Args>, 'and' | 'or' | 'not'>
>;

/**
 * Builder class for composing criteria with a simple and type-safe API.
 * Provides methods for field criteria (`when`) and logical operators (`$and`, `$or`, `$not`).
 *
 * @typeParam TT - The schema type that contains the Type information.
 * @typeParam T - The type that the criteria operates on (inferred from TT).
 *
 * @internal
 */
class Logic<TT extends CriteriaSchema, T = TT['Type']> {
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
  public when<K extends keyof FilterableFields<T>, O extends OperatorNames<FilterableFields<T>[K]>>(
    field: K,
    operator: O,
    value: OperatorValue<FilterableFields<T>[K], O>,
  ): this;

  /**
   * Sets the entire criteria object.
   *
   * @param criteria - The complete criteria object to set.
   * @returns This builder instance for method chaining.
   */
  public when(criteria: CriteriaLogic<T>): this;

  // Implementation of the when method with overloads.
  public when<K extends keyof FilterableFields<T>, O extends OperatorNames<FilterableFields<T>[K]>>(
    fieldOrCriteria: K | CriteriaLogic<T>,
    operator?: O,
    value?: OperatorValue<FilterableFields<T>[K], O>,
  ): this {
    if (typeof fieldOrCriteria === 'string') {
      // Field-based criteria
      this.criteria = { ...this.criteria, [fieldOrCriteria]: { [operator!]: value! } };
    } else {
      // Complete criteria object
      this.criteria = fieldOrCriteria;
    }
    return this;
  }

  /**
   * Adds an AND condition with multiple criteria.
   * @param criteria - Array of criteria to combine with AND logic.
   * @returns This builder instance for method chaining.
   */
  public $and(criteria: CriteriaLogic<T>[]): this {
    this.criteria = { ...this.criteria, $and: criteria };
    return this;
  }

  /**
   * Adds an OR condition with multiple criteria.
   * @param criteria - Array of criteria to combine with OR logic.
   * @returns This builder instance for method chaining.
   */
  public $or(criteria: CriteriaLogic<T>[]): this {
    this.criteria = { ...this.criteria, $or: criteria };
    return this;
  }

  /**
   * Adds a NOT condition that negates a criteria.
   * @param criteria - The criteria to negate.
   * @returns This builder instance for method chaining.
   */
  public $not(criteria: CriteriaLogic<T>): this {
    this.criteria = { ...this.criteria, $not: criteria };
    return this;
  }
}

/**
 * Class that handles criteria composition logic.
 * Provides methods for combining criteria with AND, OR, and NOT operations.
 * Automatically handles argument splitting for composed criteria.
 *
 * @typeParam T - The type that the criteria operates on.
 * @typeParam Args - The argument types for the criteria.
 *
 * @internal
 */
class CriteriaComposer<T, Args extends Any[]> {
  public currentCriteriaId?: string;

  constructor(
    private readonly criteriaConstructor: CriteriaConstructor<Args, CriteriaSchema>,
    currentCriteriaId?: string,
  ) {
    this.currentCriteriaId = currentCriteriaId;
  }

  /**
   * Combines this criteria with another criteria using AND logic.
   * The argument combination is handled automatically.
   *
   * @param other - The other criteria to combine with.
   * @returns A new criteria that represents the AND combination.
   */
  public and<Args2 extends Any[]>(other: Criteria<T, Args2>): Criteria<T, [...Args, ...Args2]> {
    const andConstructor = (...combinedArgs: [...Args, ...Args2]) => {
      const { firstArgs, secondArgs } = this.splitArgs(combinedArgs);

      const firstCriteria = this.criteriaConstructor(...firstArgs).criteria;
      const secondCriteria = other(...secondArgs).value;

      return logic({} as CriteriaSchema).when({ $and: [firstCriteria, secondCriteria] });
    };

    const andCriteriaFn = (...args: [...Args, ...Args2]) => ({
      value: andConstructor(...args).criteria,
    });
    const andComposer = new CriteriaComposer(andConstructor);

    // Use the other criteria's as part of the uniqueness.
    const andCriteria = component('Criteria', andCriteriaFn, andComposer, { other }) as Criteria<
      T,
      [...Args, ...Args2]
    >;

    // Set the currentCriteriaId for future NOT operations
    andComposer.currentCriteriaId = andCriteria.id;

    return andCriteria;
  }

  /**
   * Combines this criteria with another criteria using OR logic.
   * The argument combination is handled automatically.
   *
   * @param other - The other criteria to combine with.
   * @returns A new criteria that represents the OR combination.
   */
  public or<Args2 extends Any[]>(other: Criteria<T, Args2>): Criteria<T, [...Args, ...Args2]> {
    const orConstructor = (...combinedArgs: [...Args, ...Args2]) => {
      const { firstArgs, secondArgs } = this.splitArgs(combinedArgs);

      const firstCriteria = this.criteriaConstructor(...firstArgs).criteria;
      const secondCriteria = other(...secondArgs).value;

      return logic({} as CriteriaSchema).when({ $or: [firstCriteria, secondCriteria] });
    };

    const orCriteriaFn = (...args: [...Args, ...Args2]) => ({
      value: orConstructor(...args).criteria,
    });
    const orComposer = new CriteriaComposer(orConstructor);

    // Use the other criteria's as part of the uniqueness.
    const orCriteria = component('Criteria', orCriteriaFn, orComposer, { other }) as Criteria<
      T,
      [...Args, ...Args2]
    >;

    // Set the currentCriteriaId for future NOT operations.
    orComposer.currentCriteriaId = orCriteria.id;

    return orCriteria;
  }

  /**
   * Negates this criteria using NOT logic.
   * @returns A new criteria that represents the negation.
   */
  public not(): Criteria<T, Args> {
    const notConstructor = (...args: Args) => {
      const criteriaValue = this.criteriaConstructor(...args).criteria;
      return logic({} as CriteriaSchema).when({ $not: criteriaValue });
    };

    const notCriteriaFn = (...args: Args) => ({ value: notConstructor(...args).criteria });
    const notComposer = new CriteriaComposer(notConstructor);

    // Use the current criteria ID to differentiate from other NOT operations
    return component('Criteria', notCriteriaFn, notComposer, {
      // HACK: This is a hack to differentiate between NOT operations.
      currentCriteriaId: this.currentCriteriaId,
    }) as Criteria<T, Args>;
  }

  /**
   * Splits combined arguments into separate arguments for each criteria.
   * Uses intelligent heuristics to determine the optimal split point.
   *
   * @param combinedArgs - The combined arguments from both criteria.
   * @returns Object with first and second arguments properly split.
   * @private
   */
  private splitArgs<Args2 extends Any[]>(
    combinedArgs: [...Args, ...Args2],
  ): { firstArgs: Args; secondArgs: Args2 } {
    // Intelligent argument splitting based on common patterns:
    // - Single argument: first criteria gets it, second gets none.
    // - Two arguments: first gets first arg, second gets second arg.
    // - Multiple arguments: first gets all except last, second gets last.

    if (combinedArgs.length === 1) {
      // Single argument case: first criteria takes it.
      return {
        firstArgs: combinedArgs as unknown as Args,
        secondArgs: [] as unknown as Args2,
      };
    } else if (combinedArgs.length === 2) {
      // Two arguments case: split evenly.
      return {
        firstArgs: [combinedArgs[0]] as Args,
        secondArgs: [combinedArgs[1]] as Args2,
      };
    } else {
      // Multiple arguments case: first gets all except last.
      return {
        firstArgs: combinedArgs.slice(0, -1) as Args,
        secondArgs: combinedArgs.slice(-1) as Args2,
      };
    }
  }
}

/**
 * Creates a new Logic instance for fluent criteria composition based on a schema.
 *
 * @typeParam T - The type that the criteria operates on.
 * @param schema - The schema to use for the criteria.
 * @returns A new Logic instance.
 *
 * @public
 */
const logic = <T extends CriteriaSchema>(schema: T) => new Logic(schema);

/**
 * Creates a new criteria component based on a constructor.
 *
 * @typeParam Params - The parameters for the criteria.
 * @typeParam S - The schema type.
 * @param constructor - The criteria constructor.
 * @returns A new Criteria instance.
 *
 * @public
 */
const criteria = <Params extends Any[], S extends CriteriaSchema>(
  constructor: CriteriaConstructor<Params, S>,
) => {
  const criteriaFn = (...args: Params) => ({ value: constructor(...args).criteria });
  const composer = new CriteriaComposer(constructor);

  // The final criteria component is the criteria function and the composer.
  const criteriaComponent = component('Criteria', criteriaFn, composer) as Criteria<
    S['Type'],
    Params
  >;

  // Add the registerId to the composer for NOT operations.
  composer.currentCriteriaId = criteriaComponent.id;

  return criteriaComponent;
};

export { criteria, logic };
export type { Criteria };
