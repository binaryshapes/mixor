/*
 * This file is part of the Mixor project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { Any } from './generics';
import { hash } from './hash';
import { Panic } from './panic';
import { type Result, err, isErr, isOk, ok } from './result';

/**
 * A rule function that validates a condition on a given entity.
 * Returns a Result indicating success or failure with an error message.
 *
 * @typeParam T - The type of the entity being validated.
 * @typeParam E - The type of the error that can be returned.
 *
 * @internal
 */
type RuleFunction<T, E> = (entity: T) => Result<T, E>;

/**
 * A rule that validates a condition on a given entity.
 * It follows the same pattern as Value, being both a function and an object with properties.
 *
 * @typeParam T - The type of the entity being validated.
 * @typeParam E - The type of the error that can be returned.
 *
 * @internal
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
 * @internal
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
   * @public
   */
  or: <E2>(other: Specification<T, E2>) => Specification<T, E | E2>;
  /**
   * Negates this specification.
   * Returns a specification that is satisfied when the original is not satisfied.
   *
   * @returns A new specification that is the negation of this one.
   *
   * @public
   */
  not: () => Specification<T, E | 'Specification should not be satisfied'>;
};

/**
 * Builder for creating specifications with a fluent API.
 * Allows adding rules directly or after setting a condition.
 *
 * @typeParam T - The type of the entity being validated.
 * @typeParam E - The union of all error types accumulated so far.
 *
 * @internal
 */
interface SpecificationBuilder<T, E> {
  /**
   * Sets a condition that must be true for the specification to be evaluated.
   * If the condition is false, the specification is considered satisfied.
   * Optional - rules can be added directly without calling when().
   *
   * @param condition - The condition function.
   * @returns The builder for chaining rules.
   *
   * @internal
   */
  when(condition: Condition<T>): SpecificationBuilderWithRules<T, E>;
  /**
   * Adds a rule to the specification.
   * Can be called directly without when() for unconditional rules.
   * Supports three forms: documented rule, function direct, or rule object.
   *
   * @param rule - The rule function to validate.
   * @returns The builder for chaining.
   *
   * @internal
   */
  rule<R extends Rule<T, Any>>(rule: R): SpecificationBuilderWithRules<T, E | RuleError<R>>;
  /**
   * Adds a documented rule to the specification.
   * Can be called directly without when() for unconditional rules.
   *
   * @param doc - Documentation of the rule being added.
   * @param rule - The rule function to validate.
   * @returns The builder for chaining.
   *
   * @internal
   */
  rule<R extends RuleFunction<T, Any>>(
    doc: string,
    rule: R,
  ): SpecificationBuilderWithRules<T, E | RuleFunctionError<R>>;
  /**
   * Adds a function rule to the specification.
   * Can be called directly without when() for unconditional rules.
   *
   * @param rule - The rule function to validate.
   * @returns The builder for chaining.
   *
   * @internal
   */
  rule<R extends RuleFunction<T, Any>>(
    rule: R,
  ): SpecificationBuilderWithRules<T, E | RuleFunctionError<R>>;
  /**
   * Builds the specification from the current builder state.
   * Only available when rules have been added.
   *
   * @returns A specification that can be used to validate entities.
   * @throws Throws a {@link SpecificationError} when no rules have been added.
   *
   * @internal
   */
  build(): Specification<T, E>;
}

/**
 * Initial builder state without build() method.
 * Only allows adding rules or setting conditions.
 *
 * @typeParam T - The type of the entity being validated.
 * @typeParam E - The union of all error types accumulated so far.
 *
 * @internal
 */
type SpecificationBuilderInitial<T, E> = Omit<SpecificationBuilder<T, E>, 'build'>;

/**
 * Builder state after when() has been called.
 * Only allows adding rules or building.
 *
 * @typeParam T - The type of the entity being validated.
 * @typeParam E - The union of all error types accumulated so far.
 *
 * @internal
 */
type SpecificationBuilderWithRules<T, E> = Omit<SpecificationBuilder<T, E>, 'when'>;

/**
 * Panic error for the specification module.
 *
 * @public
 */
const SpecificationError = Panic<
  'SPECIFICATION',
  // Raised when the specification is invalid.
  'NO_RULE_ADDED'
>('SPECIFICATION');

/**
 * Internal function to create a specification with common logic.
 * This is the single source of truth for all specification functionality.
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

/**
 * Creates a new specification builder with full type inference.
 * Allows adding rules directly or after setting a condition.
 *
 * @typeParam T - The type of the entity being validated.
 * @param doc - The documentation of the specification.
 * @param condition - The condition that must be true for the specification to be evaluated.
 * @param rules - The rules that must be satisfied for the specification to be satisfied.
 * @returns A specification builder with a fluent API.
 *
 * @example
 * ```ts
 * // spec-001: Basic specification with automatic type inference.
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
 * // spec-002: Complex specification with multiple rules and error accumulation.
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
): SpecificationBuilderInitial<T, E> {
  const createBuilder = <TE = E>(
    builderDoc?: string,
    builderCondition?: Condition<T>,
    builderRules: Rule<T, Any>[] = [],
  ): SpecificationBuilder<T, TE> => {
    return {
      rule(...args: Any[]) {
        if (typeof args[0] === 'string' && args[1]) {
          // rule('doc', fn) - documented rule
          const createdRule = rule(args[0], args[1]) as Rule<T, Any>;
          return createBuilder<TE | RuleFunctionError<(typeof args)[1]>>(
            builderDoc,
            builderCondition,
            [...builderRules, createdRule],
          );
        } else if (typeof args[0] === 'function') {
          // rule(fn) - function without documentation
          const createdRule = rule(args[0]) as Rule<T, Any>;
          return createBuilder<TE | RuleFunctionError<(typeof args)[0]>>(
            builderDoc,
            builderCondition,
            [...builderRules, createdRule],
          );
        } else {
          // rule(ruleObject) - predefined rule object
          return createBuilder<TE | RuleError<(typeof args)[0]>>(builderDoc, builderCondition, [
            ...builderRules,
            args[0] as Rule<T,
              Any>,
          ]);
        }
      },
      build() {
        if (builderRules.length === 0) {
          throw new SpecificationError('NO_RULE_ADDED', 'Cannot build specification without rules');
        }
        return createSpecification(builderDoc, builderCondition, builderRules);
      },
      when(cond: Condition<T>): SpecificationBuilderWithRules<T, TE> {
        return createBuilder<TE>(builderDoc, cond, builderRules) as SpecificationBuilderWithRules<
          T,
          TE
        >;
      },
    } as SpecificationBuilder<T, TE>;
  };

  return createBuilder(doc, condition, rules) as SpecificationBuilderInitial<T, E>;
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
 * // spec-003: Basic rule creation without documentation.
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
 * // spec-004: Rule creation with documentation.
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
function rule<T, E>(...args: [RuleFunction<T, E>] | [string, RuleFunction<T, E>]): Rule<T, E> {
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
}

/**
 * Type guard to check if a value is a specification.
 *
 * @param maybeSpec - The value to check.
 * @returns True if the value is a specification, false otherwise.
 *
 * @example
 * ```ts
 * // spec-005: Checking if a value is a specification.
 * const adminSpec = spec<User>()
 *   .rule('admin permission', u => u.permissions.includes('manage_users') ? ok(u) : err('NO_PERMISSION'))
 *   .build();
 *
 * const isValidSpec = isSpec(adminSpec); // true.
 * const isNotSpec = isSpec({}); // false.
 * ```
 *
 * @public
 */
const isSpec = (maybeSpec: unknown): maybeSpec is Specification<Any, Any> =>
  !!maybeSpec &&
  typeof maybeSpec === 'function' &&
  '_tag' in maybeSpec &&
  '_hash' in maybeSpec &&
  maybeSpec._tag === 'Specification';

export type { Specification };
export { spec, rule, isSpec, SpecificationError };
