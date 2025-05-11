/*
 * This file is part of the Daikit project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { type Result } from '@daikit/result';

/**
 * Represents a type that can be used to justify the use of `any`.
 * This type is used internally to allow for flexible group validation rules
 * while maintaining type safety at the API level.
 *
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyValue = any;

/**
 * Represents a validator function that takes an input and returns a Result.
 *
 * @typeParam T - The type of the input value.
 * @typeParam E - The type of the error message.
 * @param input - The input value to validate.
 * @returns A Result indicating the success or failure of the validation.
 *
 * @public
 */
type Validator<T, E extends string> = (input: T) => Result<void, E>;

/**
 * Represents a validation rule with a validator and description.
 *
 * @typeParam T - The type of the input value.
 * @typeParam E - The type of the error message.
 *
 * @internal
 */
type ValidationRule<T, E extends string> = {
  validator: Validator<T, E>;
  description: string;
};

/**
 * Represents a validation rule that applies to all fields.
 *
 * @typeParam T - The type of the input value.
 * @typeParam E - The type of the error message.
 *
 * @internal
 */
type ValidationRuleForAll<T, E extends string> = ValidationRule<T, E>;

/**
 * Represents a validation rule that applies to specific members.
 *
 * @typeParam T - The type of the object.
 * @typeParam E - The type of the error message.
 *
 * @internal
 */
type ValidationRuleForMembers<T, E extends string> = {
  [K in keyof T]?: readonly ValidationRule<T[K], E>[];
};

/**
 * Represents a mutable validation rule that applies to specific members.
 * Used internally during construction of validation rules.
 *
 * @typeParam T - The type of the object.
 * @typeParam E - The type of the error message.
 *
 * @internal
 */
type MutableValidationRuleForMembers<T, E extends string> = {
  [K in keyof T]?: ValidationRule<T[K], E>[];
};

/**
 * Represents a validation rule that applies to groups of members.
 * The validator type is inferred from the union of the types of the selected fields.
 *
 * @typeParam T - The type of the object.
 * @typeParam K - The keys of the group.
 * @typeParam E - The type of the error message.
 *
 * @internal
 */
type ValidationRuleForGroups<T, K extends keyof T, E extends string> = {
  group: readonly K[];
  validator: Validator<T[K], E>;
  description: string;
};

/**
 * Represents a set of validation rules for an object.
 * The byGroup property uses AnyValue to allow for flexible group validation rules
 * while maintaining type safety at the API level.
 *
 * @typeParam T - The type of the object.
 * @typeParam E - The union type of all possible error messages.
 *
 * @public
 */
type ValidationRules<T, E extends string> = {
  forAll?: readonly ValidationRuleForAll<T, E>[];
  byMember?: ValidationRuleForMembers<T, E>;
  byGroup?: readonly ValidationRuleForGroups<T, AnyValue, E>[];
};

/**
 * Internal type for mutable validation rules during construction.
 * The byGroup property uses AnyValue to allow for flexible group validation rules
 * while maintaining type safety at the API level.
 *
 * @typeParam T - The type of the object.
 * @typeParam E - The union type of all possible error messages.
 *
 * @internal
 */
type MutableValidationRules<T, E extends string> = {
  forAll: ValidationRuleForAll<T, E>[];
  byMember: MutableValidationRuleForMembers<T, E>;
  byGroup: ValidationRuleForGroups<T, AnyValue, E>[];
};

/**
 * Builder class for creating validation rules.
 *
 * @typeParam T - The type of the object to validate.
 * @typeParam E - The union type of all possible error messages.
 *
 * @public
 */
class Validation<T, E extends string = never> {
  private rules: MutableValidationRules<T, E> = {
    forAll: [],
    byMember: {},
    byGroup: [],
  };

  /**
   * Creates a new instance of the Validation builder.
   *
   * @typeParam T - The type of the object to validate.
   * @returns A new instance of the Validation builder.
   *
   * @public
   */
  public static create<T>(): Validation<T, never> {
    return new Validation<T, never>();
  }

  /**
   * Adds a validator that applies to all fields.
   *
   * @typeParam F - The type of the error message.
   * @param rule - The validation rule to add.
   * @returns The builder instance for method chaining.
   *
   * @public
   */
  public forAll<F extends string>(rule: ValidationRule<T, F>): Validation<T, E | F> {
    this.rules.forAll.push(rule as unknown as ValidationRule<T, E>);
    return this as unknown as Validation<T, E | F>;
  }

  /**
   * Adds a validator for a specific member.
   *
   * @typeParam K - The key of the member.
   * @typeParam F - The type of the error message.
   * @param member - The member to validate.
   * @param rule - The validation rule to add.
   * @returns The builder instance for method chaining.
   *
   * @public
   */
  public forMember<K extends keyof T, F extends string>(
    member: K,
    rule: ValidationRule<T[K], F>,
  ): Validation<T, E | F> {
    if (!this.rules.byMember[member]) {
      this.rules.byMember[member] = [];
    }
    this.rules.byMember[member].push(rule as unknown as ValidationRule<T[keyof T], E>);
    return this as unknown as Validation<T, E | F>;
  }

  /**
   * Adds a validator for a group of members.
   *
   * @typeParam K - The keys of the group.
   * @typeParam F - The type of the error message.
   * @param group - The group of members to validate.
   * @param rule - The validation rule to add.
   * @returns The builder instance for method chaining.
   *
   * @public
   */
  public forGroup<K extends keyof T, F extends string>(
    group: readonly K[],
    rule: ValidationRule<T[K], F>,
  ): Validation<T, E | F> {
    this.rules.byGroup.push({
      group,
      validator: rule.validator,
      description: rule.description,
    } as unknown as ValidationRuleForGroups<T, K, E>);
    return this as unknown as Validation<T, E | F>;
  }

  /**
   * Builds the validation rules.
   *
   * @returns The validation rules.
   *
   * @public
   */
  public build(): ValidationRules<T, E> {
    return {
      forAll: this.rules.forAll.length > 0 ? this.rules.forAll : undefined,
      byMember: Object.keys(this.rules.byMember).length > 0 ? this.rules.byMember : undefined,
      byGroup: this.rules.byGroup.length > 0 ? this.rules.byGroup : undefined,
    };
  }
}

export type { Validator, ValidationRules };
export { Validation };
