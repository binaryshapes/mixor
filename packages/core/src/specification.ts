/*
 * This file is part of the Daikit project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { Any } from './generics';
import { hash } from './hash';
import { type Result, err, isErr, isOk, ok } from './result';

/**
 * A rule function that validates a condition on a given entity.
 * Returns a Result indicating success or failure with an error message.
 *
 * @typeParam T - The type of the entity being validated.
 * @typeParam E - The type of the error that can be returned.
 *
 * @example
 * ```ts
 * // spec-001: Basic rule function with explicit error type.
 * const hasPermission: RuleFunction<User, string> = (user) =>
 *   user.permissions.includes('manage_users') ? ok(user) : err('NO_PERMISSION');
 * ```
 *
 * @public
 */
type RuleFunction<T, E> = (entity: T) => Result<T, E>;

/**
 * A rule that validates a condition on a given entity.
 * It follows the same pattern as Value, being both a function and an object with properties.
 *
 * @typeParam T - The type of the entity being validated.
 * @typeParam E - The type of the error that can be returned.
 *
 * @example
 * ```ts
 * // spec-002: Basic rule creation and usage.
 * const hasPermission = rule((user: User) =>
 *   user.permissions.includes('manage_users') ? ok(user) : err('NO_PERMISSION')
 * );
 *
 * // Validate entity.
 * const result = hasPermission(user);
 * // ok(user) or err('NO_PERMISSION').
 * ```
 *
 * @example
 * ```ts
 * // spec-003: Rule with documentation.
 * const hasPermission = rule(
 *   'User must have management permission',
 *   (user: User) => user.permissions.includes('manage_users') ? ok(user) : err('NO_PERMISSION')
 * );
 *
 * console.log(hasPermission._doc); // 'User must have management permission'.
 * ```
 *
 * @public
 */
type Rule<T, E> = ((entity: T) => Result<T, E>) & {
  readonly _tag: 'Rule';
  readonly _hash: string;
  readonly _doc?: string;
  readonly validator: RuleFunction<T, E>;
};

/**
 * A condition function that determines if a specification should be applied.
 * Returns true if the specification should be evaluated, false otherwise.
 *
 * @typeParam T - The type of the entity being validated.
 *
 * @example
 * ```ts
 * // spec-004: Basic condition function.
 * const isAdmin: Condition<User> = (user) => user.role === 'Admin';
 * ```
 *
 * @public
 */
type Condition<T> = (entity: T) => boolean;

/**
 * Utility type to extract error types from rules.
 *
 * @typeParam R - The rule type.
 *
 * @internal
 */
type RuleError<R> = R extends Rule<Any, infer E> ? E : never;

/**
 * Utility type to extract error types from rule functions.
 *
 * @typeParam F - The rule function type.
 *
 * @internal
 */
type RuleFunctionError<F> = F extends RuleFunction<Any, infer E> ? E : never;

/**
 * A specification that can validate entities based on rules and conditions.
 * Specifications can be composed and reused across different contexts.
 *
 * @typeParam T - The type of the entity being validated.
 * @typeParam E - The union of all possible error types.
 *
 * @example
 * ```ts
 * // spec-005: Basic specification with automatic type inference.
 * const adminSpec = spec<User>()
 *   .when(u => u.role === 'Admin')
 *   .rule('should have management permission', u => u.permissions.includes('manage_users'))
 *   .build();
 *
 * const result = adminSpec.satisfy(user);
 * if (isOk(result)) {
 *   console.log(unwrap(result)); // User satisfies admin specification.
 * } else {
 *   console.log(unwrap(result)); // 'NO_PERMISSION' or other validation errors.
 * }
 * ```
 *
 * @example
 * ```ts
 * // spec-006: Specification with multiple rules and error accumulation.
 * const userSpec = spec<User>()
 *   .when(() => true)
 *   .rule('should have valid email', u => u.email.includes('@') ? ok(u) : err('INVALID_EMAIL'))
 *   .rule('should have valid age', u => u.age >= 18 ? ok(u) : err('INVALID_AGE'))
 *   .rule('should have valid name', u => u.name.trim().length > 0 ? ok(u) : err('EMPTY_NAME'))
 *   .build();
 *
 * const result = userSpec.satisfy(user);
 * if (isOk(result)) {
 *   console.log(unwrap(result)); // User passes all validations.
 * } else {
 *   console.log(unwrap(result)); // 'INVALID_EMAIL', 'INVALID_AGE', or 'EMPTY_NAME'.
 * }
 * // Type is automatically inferred as: Specification<User, "INVALID_EMAIL" | "INVALID_AGE" | "EMPTY_NAME">
 * ```
 *
 * @public
 */
type Specification<T, E = Any> = {
  /**
   * The tag of the specification.
   * @public
   */
  readonly _tag: 'Specification';
  /**
   * The hash of the specification.
   * @public
   */
  readonly _hash: string;
  /**
   * The documentation of this specification (optional).
   * @public
   */
  readonly _doc?: string;
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
   * // spec-007: Combining specifications with AND logic.
   * const basicSpec = spec<User>()
   *   .when(() => true)
   *   .rule('valid email', u => u.email.includes('@') ? ok(u) : err('INVALID_EMAIL'))
   *   .build();
   * const adminSpec = spec<User>()
   *   .when(() => true)
   *   .rule('admin permission', u => u.permissions.includes('manage_users') ? ok(u) : err('NO_PERMISSION'))
   *   .build();
   * const combined = basicSpec.and(adminSpec);
   *
   * const result = combined.satisfy(user);
   * if (isOk(result)) {
   *   console.log(unwrap(result)); // User passes both specifications.
   * } else {
   *   console.log(unwrap(result)); // 'INVALID_EMAIL' or 'NO_PERMISSION'.
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
   * // spec-008: Combining specifications with OR logic.
   * const adminSpec = spec<User>()
   *   .when(() => true)
   *   .rule('admin role', u => u.role === 'Admin' ? ok(u) : err('NOT_ADMIN'))
   *   .build();
   * const managerSpec = spec<User>()
   *   .when(() => true)
   *   .rule('manager role', u => u.role === 'Manager' ? ok(u) : err('NOT_MANAGER'))
   *   .build();
   * const combined = adminSpec.or(managerSpec);
   *
   * const result = combined.satisfy(user);
   * if (isOk(result)) {
   *   console.log(unwrap(result)); // User is either admin or manager.
   * } else {
   *   console.log(unwrap(result)); // 'NOT_ADMIN' or 'NOT_MANAGER'.
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
   * @returns A new specification that is the negation of this one.
   *
   * @example
   * ```ts
   * // spec-009: Negating a specification.
   * const adminSpec = spec<User>()
   *   .when(() => true)
   *   .rule('admin role', u => u.role === 'Admin' ? ok(u) : err('NOT_ADMIN'))
   *   .build();
   * const notAdminSpec = adminSpec.not();
   *
   * const result = notAdminSpec.satisfy(user);
   * if (isOk(result)) {
   *   console.log(unwrap(result)); // User is NOT an admin.
   * } else {
   *   console.log(unwrap(result)); // 'Specification should not be satisfied'.
   * }
   * // notAdminSpec is satisfied when user is NOT an admin.
   * ```
   *
   * @public
   */
  not: () => Specification<T, E | 'Specification should not be satisfied'>;
};

/**
 * Builder for creating specifications with a fluent API.
 * Forces when() to be called before rules can be added.
 *
 * @typeParam T - The type of the entity being validated.
 * @typeParam E - The union of all error types accumulated so far.
 *
 * @example
 * ```ts
 * // spec-010: Basic specification builder usage.
 * const adminSpec = spec<User>()
 *   .when(u => u.role === 'Admin')
 *   .rule('should have management permission', u => u.permissions.includes('manage_users'))
 *   .build();
 * ```
 *
 * @example
 * ```ts
 * // spec-010: Building a complete specification from the main builder.
 * const adminSpec = spec<User>()
 *   .when(u => u.role === 'Admin')
 *   .rule('should have management permission', u => u.permissions.includes('manage_users'))
 *   .rule('should have corporate email', u => u.email.endsWith('@company.com'))
 *   .build();
 * ```
 *
 * @public
 */
interface SpecificationBuilder<T, E> {
  /**
   * Sets a condition that must be true for the specification to be evaluated.
   * If the condition is false, the specification is considered satisfied.
   * MUST be called before adding any rules.
   *
   * @param condition - The condition function.
   * @returns The builder for chaining rules.
   *
   * @example
   * ```ts
   * // spec-011: Using when condition to apply rules only in specific cases.
   * const adminSpec = spec<User>().when(u => u.role === 'Admin');
   * ```
   *
   * @public
   */
  when(condition: Condition<T>): SpecificationBuilderWithRules<T, E>;
  /**
   * Builds the specification from the current builder state.
   * Only available when no rules have been added.
   *
   * @returns A specification that can be used to validate entities.
   *
   * @example
   * ```ts
   * // spec-014: Building a complete specification.
   * const adminSpec = spec<User>()
   *   .when(u => u.role === 'Admin')
   *   .rule('should have management permission', u => u.permissions.includes('manage_users'))
   *   .rule('should have corporate email', u => u.email.endsWith('@company.com'))
   *   .build();
   * ```
   *
   * @example
   * ```ts
   * // spec-011: Building a complete specification from the rules builder.
   * const adminSpec = spec<User>()
   *   .when(u => u.role === 'Admin')
   *   .rule('should have management permission', u => u.permissions.includes('manage_users'))
   *   .rule('should have corporate email', u => u.email.endsWith('@company.com'))
   *   .build();
   * ```
   *
   * @public
   */
  build(): Specification<T, E>;
}

/**
 * Builder state after when() has been called.
 * Only allows adding rules or building.
 *
 * @typeParam T - The type of the entity being validated.
 * @typeParam E - The union of all error types accumulated so far.
 *
 * @public
 */
interface SpecificationBuilderWithRules<T, E> {
  /**
   * Adds a rule to the specification.
   *
   * @param rule - The rule function to validate.
   * @returns The builder for chaining.
   *
   * @example
   * ```ts
   * // spec-012: Adding a predefined rule to the specification.
   * const hasPermission = rule('admin permission', u => u.permissions.includes('manage_users') ? ok(u) : err('NO_PERMISSION'));
   * const adminSpec = spec<User>().rule(hasPermission);
   * ```
   *
   * @public
   */
  rule<R extends Rule<T, Any>>(rule: R): SpecificationBuilderWithRules<T, E | RuleError<R>>;
  /**
   * Adds a documented rule to the specification.
   *
   * @param doc - Documentation of the rule being added.
   * @param rule - The rule function to validate.
   * @returns The builder for chaining.
   *
   * @example
   * ```ts
   * // spec-013: Adding an inline rule with documentation.
   * const adminSpec = spec<User>().rule(
   *   'User must have management permission',
   *   u => u.permissions.includes('manage_users')
   * );
   * ```
   *
   * @public
   */
  rule<R extends RuleFunction<T, Any>>(
    doc: string,
    rule: R,
  ): SpecificationBuilderWithRules<T, E | RuleFunctionError<R>>;
  /**
   * Builds the specification from the current builder state.
   *
   * @returns A specification that can be used to validate entities.
   *
   * @example
   * ```ts
   * // spec-014: Building a complete specification.
   * const adminSpec = spec<User>()
   *   .when(u => u.role === 'Admin')
   *   .rule('should have management permission', u => u.permissions.includes('manage_users'))
   *   .rule('should have corporate email', u => u.email.endsWith('@company.com'))
   *   .build();
   * ```
   *
   * @example
   * ```ts
   * // spec-011: Building a complete specification from the rules builder.
   * const adminSpec = spec<User>()
   *   .when(u => u.role === 'Admin')
   *   .rule('should have management permission', u => u.permissions.includes('manage_users'))
   *   .rule('should have corporate email', u => u.email.endsWith('@company.com'))
   *   .build();
   * ```
   *
   * @public
   */
  build(): Specification<T, E>;
}

/**
 * Creates a rule for entity validation.
 * This function supports both documented and non-documented rules through function overloads.
 *
 * @param args - The documentation string or validation function.
 * @returns A rule that can validate entities.
 *
 * @example
 * ```ts
 * // spec-015: Basic rule creation without documentation.
 * const hasPermission = rule((user: User) =>
 *   user.permissions.includes('manage_users') ? ok(user) : err('NO_PERMISSION')
 * );
 *
 * const result = hasPermission(user);
 * // ok(user) or err('NO_PERMISSION').
 * ```
 *
 * @example
 * ```ts
 * // spec-016: Rule creation with documentation.
 * const hasPermission = rule(
 *   'User must have management permission',
 *   (user: User) => user.permissions.includes('manage_users') ? ok(user) : err('NO_PERMISSION')
 * );
 *
 * console.log(hasPermission._doc); // 'User must have management permission'.
 * ```
 *
 * @public
 */
const rule = <T, E>(...args: [RuleFunction<T, E>] | [string, RuleFunction<T, E>]): Rule<T, E> => {
  const doc = typeof args[0] === 'string' ? args[0] : undefined;
  const validator = (typeof args[0] === 'function' ? args[0] : args[1]) as RuleFunction<T, E>;
  const ruleWrapper = (entity: T): Result<T, E> => validator(entity);

  // Attach the validator function to the wrapper for introspection.
  return Object.assign(ruleWrapper, {
    validator,
    _tag: 'Rule',
    _hash: hash(doc, validator),
    _doc: doc,
  }) as Rule<T, E>;
};

/**
 * Creates a new specification builder with full type inference.
 * Forces when() to be called before rules can be added.
 *
 * @typeParam T - The type of the entity being validated.
 * @param doc - The documentation of the specification.
 * @param condition - The condition that must be true for the specification to be evaluated.
 * @param rules - The rules that must be satisfied for the specification to be satisfied.
 * @returns A specification builder with a fluent API.
 *
 * @example
 * ```ts
 * // spec-017: Basic specification with automatic type inference.
 * const adminSpec = spec<User>()
 *   .when(u => u.role === 'Admin')
 *   .rule('should have management permission', u => u.permissions.includes('manage_users'))
 *   .rule('should have corporate email', u => u.email.endsWith('@company.com'))
 *   .build();
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
 * // spec-018: Complex specification with multiple rules and error accumulation.
 * const userValidationSpec = spec<User>()
 *   .when(u => u.role === 'Admin')
 *   .rule('should have valid email', u => u.email.includes('@') ? ok(u) : err('INVALID_EMAIL'))
 *   .rule('should have valid age', u => u.age >= 18 ? ok(u) : err('INVALID_AGE'))
 *   .rule('should have valid name', u => u.name.trim().length > 0 ? ok(u) : err('EMPTY_NAME'))
 *   .rule('should have admin permissions', u => u.permissions.includes('manage_users') ? ok(u) : err('NO_ADMIN_PERMISSIONS'))
 *   .build();
 *
 * // Type is automatically inferred as: Specification<User, "INVALID_EMAIL" | "INVALID_AGE" | "EMPTY_NAME" | "NO_ADMIN_PERMISSIONS">
 * ```
 *
 * @public
 */
function spec<T, E = never>(
  doc?: string,
  condition?: Condition<T>,
  rules: Rule<T, Any>[] = [],
): SpecificationBuilder<T, E> {
  const builder = {
    when(cond: Condition<T>): SpecificationBuilderWithRules<T, E> {
      return specWithRules<T, E>(doc, cond, rules);
    },
    build() {
      return createSpecification(doc, condition, rules);
    },
  } as SpecificationBuilder<T, E>;
  return builder;
}

/**
 * Creates a new specification builder with rules after when() has been called.
 *
 * @typeParam T - The type of the entity being validated.
 * @typeParam E - The union of all error types accumulated so far.
 * @param doc - The documentation of the specification.
 * @param condition - The condition that must be true for the specification to be evaluated.
 * @param rules - The rules that must be satisfied for the specification to be satisfied.
 * @returns A specification builder that only allows adding rules or building.
 *
 * @internal
 */
function specWithRules<T, E>(
  doc?: string,
  condition?: Condition<T>,
  rules: Rule<T, Any>[] = [],
): SpecificationBuilderWithRules<T, E> {
  const builder = {
    rule(ruleOrDoc: Any, maybeRule?: Any): Any {
      if (typeof ruleOrDoc === 'string' && maybeRule) {
        // documented rule - use the global rule function
        const createdRule = rule(ruleOrDoc, maybeRule) as Rule<T, Any>;
        return specWithRules<T, E | RuleFunctionError<typeof maybeRule>>(doc, condition, [
          ...rules,
          createdRule,
        ]);
      } else {
        // rule object
        return specWithRules<T, E | RuleError<typeof ruleOrDoc>>(doc, condition, [
          ...rules,
          ruleOrDoc as Rule<T,
            Any>,
        ]);
      }
    },
    build() {
      return createSpecification(doc, condition, rules);
    },
  } as SpecificationBuilderWithRules<T, E>;
  return builder;
}

/**
 * Internal function to create a specification with common logic.
 * This eliminates code duplication between spec() and specWithRules().
 *
 * @typeParam T - The type of the entity being validated.
 * @param doc - The documentation of the specification.
 * @param condition - The condition that must be true for the specification to be evaluated.
 * @param rules - The rules that must be satisfied for the specification to be satisfied.
 * @returns A specification with satisfy, and, or, and not methods.
 *
 * @internal
 */
function createSpecification<T>(
  doc?: string,
  condition?: Condition<T>,
  rules: Rule<T, Any>[] = [],
): Specification<T, Any> {
  const satisfy = (entity: T) => {
    if (condition && !condition(entity)) return ok(entity);
    if (rules.length === 0) return ok(entity);
    for (const rule of rules) {
      const result = rule(entity);
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

  const not = () =>
    makeSpec((entity: T) => {
      const r = satisfy(entity);
      return isOk(r) ? err('Specification should not be satisfied') : ok(entity);
    });

  const makeSpec = (satisfy: Any) => {
    return Object.assign(satisfy, {
      _tag: 'Specification' as const,
      _hash: hash(rules),
      _doc: doc ?? (rules.length > 0 ? rules[0]._doc : undefined),
      satisfy,
      and,
      or,
      not,
    });
  };

  return makeSpec(satisfy);
}

export type { Specification };
export { spec, rule };
