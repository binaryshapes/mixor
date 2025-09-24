/**
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { type Failure, type Result, err, isErr, isOk, ok } from '../result';
import { type Component, Panic, component, isComponent } from '../system';
import type { Any } from '../utils';

/**
 * A condition function that validates a condition on a given entity.
 * Returns a Result indicating success or failure with an error message.
 *
 * @typeParam T - The type of the entity being validated.
 * @typeParam E - The type of the error that can be returned.
 *
 * @internal
 */
type ConditionFunction<T, E> = (entity: T) => Result<T, E>;

/**
 * A condition that validates a condition on a given entity.
 * It follows the same pattern as Value, being both a function and an object with properties.
 *
 * @typeParam T - The type of the entity being validated.
 * @typeParam E - The type of the error that can be returned.
 *
 * @public
 */
type Condition<T, E> = Component<
  'Condition',
  {
    (entity: T): Result<T, E>;
  }
>;

/**
 * Panic error for the specification module.
 * Raised when the specification is invalid or cannot be built.
 *
 * @public
 */
class SpecificationError extends Panic<'Specification', 'NoConditionAdded' | 'InvalidCondition'>(
  'Specification',
) {}

/**
 * A specification class that can validate entities based on conditions.
 * Specifications can be composed and reused across different contexts.
 *
 * @typeParam T - The type of the entity being validated.
 * @typeParam E - The union of all possible error types.
 *
 * @public
 */
class Specification<T, E = Any> {
  private readonly conditions: Condition<T, E>[];

  /**
   * Creates a new Specification instance from a variadic list of conditions.
   * All conditions must have the same input type T and error type E.
   *
   * @param conditions - The conditions that must be satisfied for the specification to be satisfied.
   */
  public constructor(...conditions: Condition<T, E>[]) {
    if (conditions.length === 0) {
      throw new SpecificationError(
        'NoConditionAdded',
        'Cannot build specification without conditions',
      );
    }

    if (conditions.some((c) => !isComponent(c, 'Condition'))) {
      throw new SpecificationError(
        'InvalidCondition',
        'Cannot build specification with invalid conditions',
      );
    }

    this.conditions = conditions;
  }

  /**
   * Validates an entity against this specification.
   *
   * @remarks
   * Use if you a Result otherwise use {@link check}.
   * If any condition fails, the method returns an error Result.
   * If all conditions are satisfied, the method returns a success Result with the
   * input entity data.
   *
   * @param entity - The entity to validate.
   * @returns A Result with the entity on success or validation errors on failure.
   */
  public satisfy(entity: T): Result<T, E> {
    for (const condition of this.conditions) {
      const result = condition(entity);
      if (isErr(result)) {
        return result;
      }
    }
    return ok(entity);
  }

  /**
   * Checks if an entity satisfies this specification.
   * Returns a boolean indicating success or failure.
   *
   * @param entity - The entity to check.
   * @returns A boolean indicating success or failure.
   */
  public check(entity: T): boolean {
    return isOk(this.satisfy(entity));
  }

  /**
   * Combines this specification with another using AND logic.
   * Both specifications must be satisfied for the result to be successful.
   *
   * @param other - The other specification to combine with.
   * @returns A new specification that requires both to be satisfied.
   */
  public and<E2>(other: Specification<T, E2>): Specification<T, E | E2> {
    return new Specification<T, E | E2>(
      ...this.conditions,
      ...(other as Specification<T, E2>).conditions,
    );
  }

  /**
   * Combines this specification with another using OR logic.
   * At least one specification must be satisfied for the result to be successful.
   *
   * @param other - The other specification to combine with.
   * @returns A new specification that requires at least one to be satisfied.
   */
  public or<E2>(other: Specification<T, E2>): Specification<T, E | E2> {
    return new Specification<T, E | E2>(
      condition((entity: T) => {
        const r1 = this.satisfy(entity);
        if (isOk(r1)) return r1;
        return other.satisfy(entity);
      }),
    );
  }

  /**
   * Negates this specification.
   * Returns a specification that is satisfied when the original is not satisfied.
   *
   * @param e - The error to return when the original specification is satisfied.
   * @returns A new specification that is the negation of this one.
   */
  public not<TE extends string | Failure<Any>>(e: TE): Specification<T, E | TE> {
    return new Specification<T, E | TE>(
      condition((entity: T) => {
        const r = this.satisfy(entity);
        return isOk(r) ? err(e) : ok(entity);
      }),
    );
  }
}

/**
 * Creates a specification from a variadic list of conditions.
 * All conditions must have the same input type T and error type E.
 *
 * @typeParam T - The type of the entity being validated.
 * @typeParam E - The type of the error that can be returned.
 * @param conditions - The conditions that must be satisfied for the specification to be satisfied.
 * @returns A specification that can be used to validate entities.
 *
 * @public
 */
const spec = <T, E>(...conditions: Condition<T, E>[]): Specification<T, E> =>
  new Specification<T, E>(...conditions);

/**
 * Creates a condition for entity validation.
 *
 * @param validator - The validation function.
 * @returns A condition that can validate entities.
 *
 * @public
 */
const condition = <T, E>(validator: ConditionFunction<T, E>): Condition<T, E> =>
  component('Condition', validator) as Condition<T, E>;

export { SpecificationError, condition, spec };
export type { Condition, Specification };
