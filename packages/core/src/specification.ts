/*
 * This file is part of the Mixor project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { Any } from './generics';
import { Panic } from './panic';
import { type Result, err, isErr, isOk, ok } from './result';
import { type Traceable, isTraceable, traceInfo, traceable } from './trace';

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
 * @internal
 */
type Condition<T, E> = Traceable<
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
type Specification<T, E = Any> = Traceable<
  'Spec',
  {
    /**
     * Validates an entity against this specification.
     * Returns a Result indicating success or failure with validation errors.
     *
     * @param entity - The entity to validate.
     * @returns A Result with the entity on success or validation errors on failure.
     *
     * @public
     */
    satisfy: (entity: T) => Result<T, E>;
    /**
     * Combines this specification with another using AND logic.
     * Both specifications must be satisfied for the result to be successful.
     *
     * @param other - The other specification to combine with.
     * @returns A new specification that requires both to be satisfied.
     *
     * @example
     * ```ts
     * // spec-003: Combining specifications with AND logic.
     * const adminSpec = spec(
     *   condition((u: User) => u.role === 'Admin' ? ok(u) : err('NOT_ADMIN')),
     *   condition((u: User) => u.email.endsWith('@company.com') ? ok(u) : err('INVALID_EMAIL'))
     * );
     *
     * const emailSpec = spec(
     *   condition((u: User) => u.email.endsWith('@company.com') ? ok(u) : err('INVALID_EMAIL'))
     * );
     *
     * const combinedSpec = adminSpec.and(emailSpec);
     * const result = combinedSpec.satisfy(user);
     * if (isErr(result)) {
     *   // unwrap(result): 'NOT_ADMIN' | 'INVALID_EMAIL'.
     * } else {
     *   // unwrap(result): user object (when both specs are satisfied).
     * }
     * ```
     *
     * @public
     */
    and: <E2>(other: Specification<T, E2>) => Specification<T, E | E2>;
    /**
     * Combines this specification with another using OR logic.
     * At least one specification must be satisfied for the result to be successful.
     *
     * @param other - The other specification to combine with.
     * @returns A new specification that requires at least one to be satisfied.
     *
     * @example
     * ```ts
     * // spec-004: Combining specifications with OR logic.
     * const adminSpec = spec(
     *   condition((u: User) => u.role === 'Admin' ? ok(u) : err('NOT_ADMIN'))
     * );
     *
     * const userSpec = spec(
     *   condition((u: User) => u.role === 'User' ? ok(u) : err('NOT_USER'))
     * );
     *
     * const combinedSpec = adminSpec.or(userSpec);
     * const result = combinedSpec.satisfy(user);
     * if (isOk(result)) {
     *   // unwrap(result): user object (when at least one spec is satisfied).
     * } else {
     *   // unwrap(result): 'NOT_ADMIN' | 'NOT_USER' (when both specs fail).
     * }
     * ```
     *
     * @public
     */
    or: <E2>(other: Specification<T, E2>) => Specification<T, E | E2>;
    /**
     * Negates this specification.
     * Returns a specification that is satisfied when the original is not satisfied.
     *
     * @param e - The error to return when the original specification is satisfied.
     * @returns A new specification that is the negation of this one.
     *
     * @example
     * ```ts
     * // spec-005: Negating a specification with custom error.
     * const adminSpec = spec(
     *   condition((u: User) => u.role === 'Admin' ? ok(u) : err('NOT_ADMIN'))
     * );
     *
     * const notAdminSpec = adminSpec.not('USER_MUST_NOT_BE_ADMIN');
     * const result = notAdminSpec.satisfy(user);
     * if (isErr(result)) {
     *   // unwrap(result): 'USER_MUST_NOT_BE_ADMIN'.
     * } else {
     *   // unwrap(result): user object (when user is not admin).
     * }
     * ```
     *
     * @public
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
const SpecificationError = Panic<
  'SPECIFICATION',
  // Raised when the specification is built without conditions.
  | 'NO_CONDITION_ADDED'
  // Raised when the condition is invalid.
  | 'INVALID_CONDITION'
>('SPECIFICATION');

/**
 * Creates a specification from a variadic list of conditions.
 * All conditions must have the same input type T and error type E.
 *
 * @typeParam T - The type of the entity being validated.
 * @typeParam E - The type of the error that can be returned.
 * @param conditions - The conditions that must be satisfied for the specification to be satisfied.
 * @returns A specification that can be used to validate entities.
 *
 * @example
 * ```ts
 * // spec-001: Basic specification with automatic type inference.
 * const adminSpec = spec(
 *   condition((u: User) => u.role === 'Admin' ? ok(u) : err('NOT_ADMIN')).meta({
 *     scope: 'user',
 *     name: 'isAdmin',
 *     description: 'A user must be an admin'
 * }),
 *   condition((u: User) => u.permissions.includes('manage_users') ? ok(u) : err('NO_PERMISSION')).meta({
 *     scope: 'user',
 *     name: 'hasManageUsersPermission',
 *     description: 'A user must have the manage users permission'
 * }),
 *   condition((u: User) => u.email.endsWith('@company.com') ? ok(u) : err('NO_CORPORATE_EMAIL')).meta({
 *     scope: 'user',
 *     name: 'hasCorporateEmail',
 *     description: 'A user must have a corporate email'
 * })
 * );
 *
 * // Usage in any context.
 * const result = adminSpec.satisfy(user);
 * if (isOk(result)) {
 *   // Logic when specification is satisfied.
 *   return ok('Success');
 * } else {
 *   return err(result.error);
 * }
 * ```
 *
 * @example
 * ```ts
 * // spec-002: Complex specification with multiple conditions and error accumulation.
 * const userValidationSpec = spec(
 *   condition((u: User) => u.role === 'Admin' ? ok(u) : err('NOT_ADMIN')),
 *   condition((u: User) => u.email.includes('@') ? ok(u) : err('INVALID_EMAIL')),
 *   condition((u: User) => u.age >= 18 ? ok(u) : err('INVALID_AGE')),
 *   condition((u: User) => u.name.trim().length > 0 ? ok(u) : err('EMPTY_NAME')),
 *   condition((u: User) => u.permissions.includes('manage_users') ? ok(u) : err('NO_ADMIN_PERMISSIONS'))
 * );
 *
 * // Type is automatically inferred as: Specification<User, "NOT_ADMIN" | "INVALID_EMAIL" | "INVALID_AGE" | "EMPTY_NAME" | "NO_ADMIN_PERMISSIONS">
 * ```
 *
 * @public
 */
function spec<T, E>(...conditions: Condition<T, E>[]): Specification<T, E> {
  if (conditions.length === 0) {
    throw new SpecificationError(
      'NO_CONDITION_ADDED',
      'Cannot build specification without conditions',
    );
  }

  if (conditions.some((c) => !isCondition(c))) {
    throw new SpecificationError(
      'INVALID_CONDITION',
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

  const and = (other: Any) =>
    makeSpec((entity: T) => {
      const r1 = satisfy(entity);
      if (isErr(r1)) return r1;
      return other.satisfy(entity);
    });

  const or = (other: Any) =>
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

  const makeSpec = (satisfy: Any) => {
    const specObject = Object.assign(satisfy, {
      satisfy,
      and,
      or,
      not,
    });

    return traceable('Spec', specObject) as Specification<T, E>;
  };

  return makeSpec(satisfy);
}

/**
 * Creates a condition for entity validation.
 *
 * @param validator - The validation function.
 * @returns A condition that can validate entities.
 *
 * @example
 * ```ts
 * // spec-006: Condition with metadata.
 * const hasPermission = condition((user: User) =>
 *   user.permissions.includes('manage_users') ? ok(user) : err('NO_PERMISSION')
 * ).meta({
 *   scope: 'user',
 *   name: 'hasManageUsersPermission',
 *   description: 'A user must have the manage users permission'
 * });
 *
 * // traceInfo(hasPermission).id: unique UUID.
 * // traceInfo(hasPermission).tag: 'Condition'.
 * // traceInfo(hasPermission).hash: content hash.
 * // All metadata is now accessible through traceInfo function.
 * ```
 *
 * @public
 */
const condition = <T, E>(validator: ConditionFunction<T, E>): Condition<T, E> =>
  traceable('Condition', validator) as Condition<T, E>;

/**
 * Type guard to check if a value is a specification.
 *
 * @param maybeSpec - The value to check.
 * @returns True if the value is a specification, false otherwise.
 *
 * @public
 */
const isSpec = (maybeSpec: Any): maybeSpec is Specification<Any, Any> =>
  isTraceable(maybeSpec) && traceInfo(maybeSpec as Specification<Any, Any>).tag === 'Spec';

/**
 * Type guard to check if a value is a condition.
 *
 * @param maybeCondition - The value to check.
 * @returns True if the value is a condition, false otherwise.
 *
 * @public
 */
const isCondition = (maybeCondition: Any): maybeCondition is Condition<Any, Any> =>
  isTraceable(maybeCondition) &&
  traceInfo(maybeCondition as Condition<Any, Any>).tag === 'Condition';

export type { Specification };
export { spec, condition, isSpec, isCondition, SpecificationError };
