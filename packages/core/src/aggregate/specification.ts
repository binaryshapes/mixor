/**
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { type Failure, type Result, assert, isErr, isOk, ok } from '../result';
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
type Condition<T, E> = Component<'Condition', ConditionFunction<T, E>>;

/**
 * A specification that can validate entities based on conditions.
 * Follows the same pattern as Condition.
 *
 * @typeParam T - The type of the entity being validated.
 * @typeParam E - The union of all possible error types.
 *
 * @public
 */
type Specification<T, E> = Component<'Specification', SpecificationBuilder<T, E>>;

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
class SpecificationBuilder<T, E> {
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
   * Use if you a Result otherwise use {@link assert}.
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
   * Asserts if an entity satisfies the specification.
   * Returns a function which asserts the entity satisfies the specification.
   * It is useful to use in a flow to assert the entity satisfies the specification.
   *
   * @param entity - The entity to check.
   * @returns A function which asserts the entity satisfies the specification and returns the value.
   */
  public assert(entity: T) {
    const result = this.satisfy(entity);
    return <V>(value: V): Result<V, E> => (isErr(result) ? result : ok(value));
  }

  /**
   * Combines this specification with another using AND logic.
   * Both specifications must be satisfied for the result to be successful.
   *
   * @param other - The other specification to combine with.
   * @returns A new specification that requires both to be satisfied.
   */
  public and<E2>(other: Specification<T, E2>): SpecificationBuilder<T, E | E2> {
    return new SpecificationBuilder<T, E | E2>(
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
  public or<E2>(other: Specification<T, E2>): SpecificationBuilder<T, E | E2> {
    return new SpecificationBuilder<T, E | E2>(
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
  public not<TE extends string | Failure<Any>>(e: TE): SpecificationBuilder<T, E | TE> {
    return new SpecificationBuilder<T, E | TE>(
      condition((entity: T) => isErr(this.satisfy(entity)), e),
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
  component('Specification', new SpecificationBuilder<T, E>(...conditions)) as Specification<T, E>;

/**
 * Condition constructor overloads.
 *
 * @internal
 */
interface ConditionConstructor {
  /**
   * Creates a condition from a function.
   *
   * @param fn - The function to validate the entity.
   * @returns A condition that can validate entities.
   */
  <T, E>(fn: ConditionFunction<T, E>): Condition<T, E>;
  /**
   * Creates a condition from a function and an error (assert function).
   *
   * @param fn - The function to validate the entity.
   * @param error - The error to return if the function fails.
   * @returns A condition that can validate entities.
   */
  <T, E>(fn: (v: T) => boolean, error: E): Condition<T, E>;
}

/**
 * Creates a new condition.
 *
 * @remarks
 * A condition is a {@link Component} function that validates a condition on a given entity.
 * Commonly used in specifications.
 *
 * @param args - The condition definitions.
 * - If the first argument is a function and the second argument is an error, the condition will
 * be created with the assert function.
 * - If is a only a function, this needs to be a {@link Result} function.
 * @returns A condition that can be used in a specification.
 *
 * @public
 */
const condition: ConditionConstructor = <T, E>(...args: Any[]) => {
  const fn = args[0];
  const error = args.slice(1) as Any;

  const cond = error
    ? // The condition is just a wrapper around the assert function.
      component('Condition', assert(fn, error), { fn, error })
    : component('Condition', fn);

  return cond as Condition<T, E>;
};

export { SpecificationError, condition, spec };
export type { Condition, Specification };
