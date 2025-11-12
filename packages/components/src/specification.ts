/**
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { n } from '@nuxo/core';

/**
 * The tag for the specification component.
 *
 * @internal
 */
const SPECIFICATION_TAG = 'Specification' as const;

/**
 * The tag for the condition component.
 *
 * @internal
 */
const CONDITION_TAG = 'Condition' as const;

/**
 * A condition that validates a condition on a given entity.
 * It follows the same pattern as Value, being both a function and an object with properties.
 *
 * @typeParam T - The type of the entity being validated.
 * @typeParam E - The type of the error that can be returned.
 *
 * @public
 */
type Condition<T, E extends string> = n.Component<typeof CONDITION_TAG, n.ResultFunction<T, E>>;

/**
 * A specification that can validate entities based on conditions.
 * Follows the same pattern as Condition.
 *
 * @typeParam T - The type of the entity being validated.
 * @typeParam E - The union of all possible error types.
 *
 * @public
 */
type Specification<T, E extends string> = n.Component<
  typeof SPECIFICATION_TAG,
  SpecificationBuilder<T, E>
>;

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
  <T, E extends string>(fn: n.ResultFunction<T, E>): Condition<T, E>;
  /**
   * Creates a condition from a function and an error (assert function).
   *
   * @param fn - The function to validate the entity.
   * @param error - The error to return if the function fails.
   * @returns A condition that can validate entities.
   */
  <T, E extends string>(fn: (v: T) => boolean, error: E): Condition<T, E>;
}

/**
 * Panic error for the specification module.
 * Raised when the specification is invalid or cannot be built.
 *
 * - `NoConditionAdded`: No conditions were added to the specification.
 * - `InvalidCondition`: The condition is invalid.
 *
 * @public
 */
class SpecificationPanic extends n.panic<
  typeof SPECIFICATION_TAG,
  | 'NoConditionAdded'
  | 'InvalidCondition'
>(SPECIFICATION_TAG) {}

/**
 * A specification class that can validate entities based on conditions.
 * Specifications can be composed and reused across different contexts.
 *
 * @typeParam T - The type of the entity being validated.
 * @typeParam E - The union of all possible error types.
 *
 * @public
 */
class SpecificationBuilder<T, E extends string> {
  public readonly _conditions: Condition<T, E>[];

  /**
   * Creates a new Specification instance from a variadic list of conditions.
   * All conditions must have the same input type T and error type E.
   *
   * @param conditions - The conditions that must be satisfied for the specification to be satisfied.
   */
  public constructor(...conditions: Condition<T, E>[]) {
    if (conditions.length === 0) {
      throw new SpecificationPanic(
        'NoConditionAdded',
        'Cannot build specification without conditions',
      );
    }

    if (conditions.some((c) => !n.isComponent(c, CONDITION_TAG))) {
      throw new SpecificationPanic(
        'InvalidCondition',
        'Cannot build specification with invalid conditions',
      );
    }

    this._conditions = conditions;
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
  public satisfy(entity: T): n.Result<T, E> {
    for (const condition of this._conditions) {
      const result = condition(entity);
      if (n.isErr(result)) {
        return result;
      }
    }
    return n.ok(entity);
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
    return <V>(value: V): n.Result<V, E> => (n.isErr(result) ? result : n.ok(value));
  }

  /**
   * Combines this specification with another using AND logic.
   * Both specifications must be satisfied for the result to be successful.
   *
   * @param other - The other specification to combine with.
   * @returns A new specification that requires both to be satisfied.
   */
  public and<E2 extends string>(other: Specification<T, E2>): SpecificationBuilder<T, E | E2> {
    const spec = specification<T, E | E2>(
      ...this._conditions,
      ...(other as Specification<T, E2>)._conditions,
    );

    if (!n.info(spec).props.doc) {
      const { title, body } = this.mergeDoc(this, other, 'AND');
      n.info(spec).doc({ title, body });
    }

    return spec;
  }

  /**
   * Combines this specification with another using OR logic.
   * At least one specification must be satisfied for the result to be successful.
   *
   * @param other - The other specification to combine with.
   * @returns A new specification that requires at least one to be satisfied.
   */
  public or<E2 extends string>(other: Specification<T, E2>): Specification<T, E | E2> {
    const cond = condition((entity: T): n.Result<T, E | E2> => {
      const r1 = this.satisfy(entity);
      if (n.isOk(r1)) return r1;
      return other.satisfy(entity);
    });

    // Only set the documentation if it is not already set (first time only).
    if (!n.info(cond).props.doc) {
      const { title, body } = this.mergeDoc(this, other, 'OR');
      n.info(cond).doc({ title, body });
    }

    return specification<T, E | E2>(cond);
  }

  /**
   * Negates this specification.
   * Returns a specification that is satisfied when the original is not satisfied.
   *
   * @param e - The error to return when the original specification is satisfied.
   * @returns A new specification that is the negation of this one.
   */
  public not<EE extends string>(e: EE): Specification<T, EE> {
    // TODO: Enhance the auto generated documentation.
    const cond = condition((entity: T) => n.isErr(this.satisfy(entity)), e);
    const spec = specification<T, EE>(cond) as Specification<T, EE>;

    if (!n.info(spec).props.doc) {
      n.info(spec).doc({
        title: `NOT ${n.info(cond).props.doc?.title}`,
        body: `Negates the specification ${n.info(cond).props.doc?.body}`,
      });
    }

    return spec;
  }

  /**
   * Merges the documentation of two specifications.
   * Commonly used when combining two specifications (AND or OR).
   *
   * @param s1 - The first specification to merge.
   * @param s2 - The second specification to merge.
   * @param type - The type of combination to merge.
   * @returns The merged documentation.
   */
  private mergeDoc(
    s1: Specification<n.Any, n.Any> | SpecificationBuilder<n.Any, n.Any>,
    s2: Specification<n.Any, n.Any> | SpecificationBuilder<n.Any, n.Any>,
    type: 'AND' | 'OR',
  ) {
    const s1Conditions = s1._conditions;
    const s2Conditions = s2._conditions;

    // Merge all conditions from this and other.
    const conditions = [...s1Conditions, ...s2Conditions];
    // Merge the documentation of all conditions.
    const title = `(${s1Conditions.map((c) => `${n.info(c).props.doc?.title}`).join(' AND ')})` +
      ` ${type} ` +
      `(${s2Conditions.map((c) => `${n.info(c).props.doc?.title}`).join(' AND ')})`;
    const body = conditions.map((c, i) => `- ${i + 1}. ${n.info(c).props.doc?.body}`).join('\n');

    return { title, body };
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
const specification = <T, E extends string>(
  ...conditions: Condition<T, E>[]
): Specification<T, E> => {
  const specificationComponent = n.component(
    SPECIFICATION_TAG,
    {},
    new SpecificationBuilder<T, E>(...conditions),
  ) as Specification<T, E>;

  // Only set the documentation if it is not already set (first time only).
  if (!n.info(specificationComponent).props.doc) {
    n.info(specificationComponent)
      .doc({
        title: `Specification ${conditions.map((c) => n.info(c).props.doc?.title).join(', ')}`,
        body: `Validates the following conditions: ${
          conditions.map((c) => `${n.info(c).props.doc?.body}`).join('\n')
        }`,
      });
  }

  // Mark for each condition as a referenced object of the specification.
  for (const c of conditions) {
    n.info(c).refs(specificationComponent);
  }

  return specificationComponent;
};

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
const condition: ConditionConstructor = <T, E extends string>(...args: n.Any[]) => {
  const fn = args[0];
  const error = args.slice(1);

  const cond = error.length > 0
    // The condition is just a wrapper around the assert function.
    ? n.component(CONDITION_TAG, n.assert(fn, error[0]), { fn, error: error[0] })
    : n.component(CONDITION_TAG, fn);

  // Only set the documentation if it is not already set (first time only).
  if (error.length > 0 && !n.info(cond).props.doc) {
    n.info(cond).doc({
      title: `${error.length > 0 ? error[0] : 'Condition'}`,
      body: `${fn.toString().split('=>')[1]?.trim()} => "${error[0]}"`,
    });
  }

  return cond as Condition<T, E>;
};

export { condition, specification, SpecificationPanic };
export type { Condition, Specification };
