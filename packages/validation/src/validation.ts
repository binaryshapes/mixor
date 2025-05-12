/*
 * This file is part of the Daikit project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { Pipeline, type Result } from '@daikit/result';

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
 * Type guard to check if a type is an object type.
 *
 * @typeParam T - The type to check.
 *
 * @internal
 */
type IsObject<T> = T extends object ? T : never;

/**
 * Represents a validation rule that applies to specific members.
 * Only available when T is an object type.
 *
 * @typeParam T - The type of the object.
 * @typeParam E - The type of the error message.
 *
 * @internal
 */
type ValidationRuleForMembers<T, E extends string> = {
  [K in keyof IsObject<T>]?: readonly ValidationRule<IsObject<T>[K], E>[];
};

/**
 * Represents a mutable validation rule that applies to specific members.
 * Only available when T is an object type.
 *
 * @typeParam T - The type of the object.
 * @typeParam E - The type of the error message.
 *
 * @internal
 */
type MutableValidationRuleForMembers<T, E extends string> = {
  [K in keyof IsObject<T>]?: ValidationRule<IsObject<T>[K], E>[];
};

/**
 * Represents a validation rule that applies to groups of members.
 * Only available when T is an object type.
 *
 * @typeParam T - The type of the object.
 * @typeParam K - The keys of the group.
 * @typeParam E - The type of the error message.
 *
 * @internal
 */
type ValidationRuleForGroups<T, K extends keyof IsObject<T>, E extends string> = {
  group: readonly K[];
  validator: Validator<IsObject<T>[K], E>;
  description: string;
};

/**
 * Represents a set of validation rules for an object.
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
 * Type for the Validation class when T is an object type.
 *
 * @typeParam T - The type of the object to validate.
 * @typeParam E - The union type of all possible error messages.
 *
 * @public
 */
type ObjectValidation<T extends object, E extends string = never> = Validation<T, E>;

/**
 * Type for the Validation class when T is a primitive type.
 *
 * @typeParam T - The type of the primitive to validate.
 * @typeParam E - The union type of all possible error messages.
 *
 * @public
 */
type PrimitiveValidation<T, E extends string = never> = Pick<Validation<T, E>, 'forAll' | 'build'>;

/**
 * Extracts error types from validation rules.
 *
 * @typeParam T - The type of the value object.
 * @typeParam VP - The type of the validation pipeline.
 *
 * @internal
 */
type ValidationPipelineError<T, VP extends ValidationPipeline<T, string>> =
  VP extends ValidationPipeline<T, infer E> ? E : never;

/**
 * Builder class for creating validation rules.
 *
 * @typeParam T - The type of the object to validate.
 * @typeParam E - The union type of all possible error messages.
 *
 * @public
 */
class Validation<T, E extends string = never> {
  protected rules: MutableValidationRules<T, E>;

  /**
   * Creates a new instance of the Validation builder.
   * The returned type will be different depending on whether T is an object or primitive type.
   *
   * @typeParam T - The type of the value to validate.
   * @returns A new instance of the Validation builder.
   *
   * @internal
   */
  private constructor() {
    // Initialize the rules with empty arrays.
    this.rules = {
      forAll: [],
      byMember: {},
      byGroup: [],
    };
  }

  /**
   * Creates a new instance of the Validation builder.
   * The returned type will be different depending on whether T is an object or primitive type.
   *
   * @typeParam T - The type of the value to validate.
   * @returns A new instance of the Validation builder.
   *
   * @public
   */
  public static create<T>() {
    const instance = new Validation<T, never>();
    return instance as unknown as T extends object
      ? ObjectValidation<T, never>
      : PrimitiveValidation<T, never>;
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
  public forAll<F extends string>(rule: ValidationRule<T, F>) {
    this.rules.forAll.push(rule as unknown as ValidationRule<T, E>);
    return this as unknown as T extends object
      ? ObjectValidation<T, E | F>
      : PrimitiveValidation<T, E | F>;
  }

  /**
   * Adds a validator for a specific member.
   * Only available when T is an object type.
   *
   * @typeParam K - The key of the member.
   * @typeParam F - The type of the error message.
   * @param member - The member to validate.
   * @param rule - The validation rule to add.
   * @returns The builder instance for method chaining.
   *
   * @public
   */
  public forMember<K extends keyof IsObject<T>, F extends string>(
    member: K,
    rule: ValidationRule<IsObject<T>[K], F>,
  ) {
    if (!this.rules.byMember[member]) {
      this.rules.byMember[member] = [];
    }
    this.rules.byMember[member].push(rule as unknown as ValidationRule<IsObject<T>[K], E>);
    return this as unknown as T extends object ? ObjectValidation<T, E | F> : never;
  }

  /**
   * Adds a validator for a group of members.
   * Only available when T is an object type.
   *
   * @typeParam K - The keys of the group.
   * @typeParam F - The type of the error message.
   * @param group - The group of members to validate.
   * @param rule - The validation rule to add.
   * @returns The builder instance for method chaining.
   *
   * @public
   */
  public forGroup<K extends keyof IsObject<T>, F extends string>(
    group: readonly K[],
    rule: ValidationRule<IsObject<T>[K], F>,
  ) {
    this.rules.byGroup.push({
      group,
      validator: rule.validator,
      description: rule.description,
    } as unknown as ValidationRuleForGroups<T, K, E>);
    return this as unknown as T extends object ? ObjectValidation<T, E | F> : never;
  }

  /**
   * Builds the validation pipeline.
   *
   * @returns The validation pipeline.
   *
   * @public
   */
  public build() {
    return new ValidationPipeline<T, E>(this.rules);
  }
}

/**
 * Represents a validation pipeline.
 *
 * @typeParam T - The type of the value to validate.
 * @typeParam E - The union type of all possible error messages.
 *
 * @public
 */
class ValidationPipeline<T, E extends string> {
  constructor(private readonly rules: ValidationRules<T, E>) {}

  /**
   * Converts the validation rules into a Pipeline that can be executed.
   * The pipeline will run all validations in sequence and return a Result.
   *
   * @param value - The value to validate.
   * @param description - Optional description for the validation pipeline.
   * @returns A Pipeline that can be executed to validate the value.
   *
   * @public
   */
  public pipe(value: T, description = 'Run validations') {
    const validationFunctions: Pipeline<void, E>[] = [];

    // Apply forAll validators.
    if (this.rules.forAll) {
      for (const { validator, description } of this.rules.forAll) {
        const anonymousFn = () => validator(value);
        validationFunctions.push(Pipeline.fromFunction(anonymousFn, description));
      }
    }

    // Apply byMember validators only if T is an object type.
    if (this.rules.byMember && typeof value === 'object' && value !== null) {
      for (const [key, validators] of Object.entries(this.rules.byMember)) {
        if (validators && Array.isArray(validators)) {
          const valueToValidate = value[key as keyof T];
          for (const { validator, description } of validators) {
            const anonymousFn = () => validator(valueToValidate);
            validationFunctions.push(
              Pipeline.fromFunction(anonymousFn, `${description} (applied to ${key})`),
            );
          }
        }
      }
    }

    // Apply byGroup validators only if T is an object type.
    if (this.rules.byGroup && typeof value === 'object' && value !== null) {
      for (const { group, validator, description } of this.rules.byGroup) {
        for (const key of group) {
          const valueToValidate = value[key as keyof T];
          const anonymousFn = () => validator(valueToValidate);
          validationFunctions.push(
            Pipeline.fromFunction(anonymousFn, `${description} (applied to ${key})`),
          );
        }
      }
    }

    return Pipeline.all(validationFunctions, description);
  }
}

export type { Validator, ValidationPipeline, ValidationPipelineError };
export { Validation };
