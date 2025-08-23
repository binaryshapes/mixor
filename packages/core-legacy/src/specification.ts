/*
 * This file is part of the Mixor project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { type Component, component, isComponent } from './component';
import type { Any } from './generics';
import { panic } from './panic';
import { type Result, err, isErr, isOk, ok } from './result';

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
 * A specification that can validate entities based on conditions.
 * Specifications can be composed and reused across different contexts.
 *
 * @typeParam T - The type of the entity being validated.
 * @typeParam E - The union of all possible error types.
 *
 * @public
 */
type Specification<T, E = Any> = Component<
  'Specification',
  {
    /**
     * Validates an entity against this specification.
     * Returns a Result indicating success or failure with validation errors.
     *
     * @param entity - The entity to validate.
     * @returns A Result with the entity on success or validation errors on failure.
     */
    satisfy: (entity: T) => Result<T, E>;
    /**
     * Combines this specification with another using AND logic.
     * Both specifications must be satisfied for the result to be successful.
     *
     * @param other - The other specification to combine with.
     * @returns A new specification that requires both to be satisfied.
     */
    and: <E2>(other: Specification<T, E2>) => Specification<T, E | E2>;

    /**
     * Combines this specification with another using OR logic.
     * At least one specification must be satisfied for the result to be successful.
     *
     * @param other - The other specification to combine with.
     * @returns A new specification that requires at least one to be satisfied.
     */
    or: <E2>(other: Specification<T, E2>) => Specification<T, E | E2>;

    /**
     * Negates this specification.
     * Returns a specification that is satisfied when the original is not satisfied.
     *
     * @param e - The error to return when the original specification is satisfied.
     * @returns A new specification that is the negation of this one.
     */
    not: <TE extends string | Record<string, Any>>(e: TE) => Specification<T, E | TE>;
  }
>;

/**
 * Panic error for the specification module.
 * Raised when the specification is invalid or cannot be built.
 *
 * @public
 */
const SpecificationError = panic<'Specification', 'NoConditionAdded' | 'InvalidCondition'>(
  'Specification',
);

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
function spec<T, E>(...conditions: Condition<T, E>[]): Specification<T, E> {
  // TODO: this should be raise a lint error too.
  if (conditions.length === 0) {
    throw new SpecificationError(
      'NoConditionAdded',
      'Cannot build specification without conditions',
    );
  }

  if (conditions.some((c) => !isCondition(c))) {
    throw new SpecificationError(
      'InvalidCondition',
      'Cannot build specification with invalid conditions',
    );
  }

  const satisfy = (entity: T) => {
    for (const condition of conditions) {
      const result = condition(entity);
      if (isErr(result)) {
        return result;
      }
    }
    return ok(entity);
  };

  const and = <E2>(other: Specification<T, E2>) =>
    makeSpec((entity: T) => {
      const r1 = satisfy(entity);
      if (isErr(r1)) return r1;
      return other.satisfy(entity);
    });

  const or = <E2>(other: Specification<T, E2>) =>
    makeSpec((entity: T) => {
      const r1 = satisfy(entity);
      if (isOk(r1)) return r1;
      return other.satisfy(entity);
    });

  const not = <TE extends string | Record<string, Any>>(e: TE) =>
    makeSpec((entity: T) => {
      const r = satisfy(entity);
      return isOk(r) ? err(e) : ok(entity);
    });

  const makeSpec = (satisfy: (entity: T) => Result<T, E | Any>) => {
    const specObject = Object.assign(satisfy, {
      satisfy,
      and,
      or,
      not,
    });

    return component('Specification', specObject) as Specification<T, E>;
  };

  return makeSpec(satisfy);
}

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

/**
 * Type guard to check if a value is a specification.
 *
 * @param maybeSpec - The value to check.
 * @returns True if the value is a specification, false otherwise.
 *
 * @public
 */
const isSpec = (maybeSpec: Any): maybeSpec is Specification<Any, Any> =>
  isComponent(maybeSpec, 'Specification');

/**
 * Type guard to check if a value is a condition.
 *
 * @param maybeCondition - The value to check.
 * @returns True if the value is a condition, false otherwise.
 *
 * @public
 */
const isCondition = (maybeCondition: Any): maybeCondition is Condition<Any, Any> =>
  isComponent(maybeCondition, 'Condition');

export type { Condition, Specification };
export { spec, condition, isSpec, isCondition, SpecificationError };
