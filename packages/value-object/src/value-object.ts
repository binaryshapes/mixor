/*
 * This file is part of the Daikit project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { Pipeline } from '@daikit/result';
import type { Validator } from '@daikit/validation';

/**
 * A type that is used to justify the use of any in value object contexts.
 * It is used to avoid type errors when using the any type through the codebase.
 *
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExplicitAny = any;

/**
 * Placeholder for a deep freeze function.
 * This should recursively apply `Object.freeze` to nested objects and arrays.
 *
 * @param obj - The object to freeze deeply.
 * @returns The deeply frozen object.
 *
 * @internal
 */
function deepFreeze<T>(obj: T): T {
  if (obj !== null && typeof obj === 'object' && !Object.isFrozen(obj)) {
    Object.freeze(obj);
    Object.getOwnPropertyNames(obj).forEach((prop) => {
      deepFreeze((obj as ExplicitAny)[prop]);
    });
  }
  return obj;
}

/**
 * Placeholder for a deep equality comparison function.
 *
 * @param a - First value to compare.
 * @param b - Second value to compare.
 * @returns True if values are deeply equal, false otherwise.
 *
 * @internal
 */
function internalDeepEqual(a: ExplicitAny, b: ExplicitAny): boolean {
  if (a === b) return true;

  if (a === null || typeof a !== 'object' || b === null || typeof b !== 'object') {
    return false;
  }

  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key) || !internalDeepEqual(a[key], b[key])) {
      return false;
    }
  }

  return true;
}

/**
 * Represents a primitive value object.
 * In practice, it is a value that is not an object.
 *
 * @internal
 */
type PrimitiveValueObject = string | number | boolean | Date | RegExp;

/**
 * Represents a validator with a description.
 *
 * @typeParam T - The type of the input value.
 * @typeParam E - The type of the error message.
 *
 * @internal
 */
type ValidatorWithDescription<T, E extends string> = {
  validator: Validator<T, E>;
  description: string;
};

/**
 * Extracts error types from a validator list.
 *
 * @typeParam T - The type of the input value.
 * @typeParam V - The validator list type.
 *
 * @internal
 */
type ExtractErrorTypes<T, V> = V extends readonly {
  validator: Validator<T, infer E>;
  description: string;
}[]
  ? E
  : never;

/**
 * Extracts error types from member validators.
 *
 * @typeParam T - The type of the value object.
 * @typeParam M - The member validators type.
 *
 * @internal
 */
type ExtractMemberErrorTypes<T, M> = M extends {
  [K in keyof T]?: readonly {
    validator: Validator<T[K], ExplicitAny>;
    description: string;
  }[];
}
  ? { [K in keyof T]: ExtractErrorTypes<T[K], M[K]> }[keyof T]
  : never;

/**
 * Extracts error types from group validators.
 *
 * @typeParam T - The type of the value object.
 * @typeParam G - The group validators type.
 *
 * @internal
 */
type ExtractGroupErrorTypes<T, G> = G extends readonly {
  group: readonly (keyof T)[];
  validator: Validator<ExplicitAny, infer E>;
  description: string;
}[]
  ? E
  : never;

/**
 * Extracts all possible error types from validators.
 *
 * @typeParam T - The type of the value object.
 * @typeParam V - The validators type.
 *
 * @internal
 */
type ExtractAllErrorTypes<T, V> =
  V extends ValueObjectValidators<T>
    ? V extends { forAll?: infer F; byMember?: infer M; byGroup?: infer G }
      ?
          | ExtractErrorTypes<T, NonNullable<F>>
          | ExtractMemberErrorTypes<T, NonNullable<M>>
          | ExtractGroupErrorTypes<T, NonNullable<G>>
      : never
    : never;

/**
 * Represents the validators for a primitive value object.
 * Only allows forAll validators.
 *
 * @typeParam T - The type of the value object.
 *
 * @internal
 */
type PrimitiveValidators<T> = {
  forAll?: readonly ValidatorWithDescription<T, string>[];
  byMember?: never;
  byGroup?: never;
};

/**
 * Extracts all possible object validators from a value object.
 *
 * @typeParam T - The type of the value object.
 *
 * @internal
 */
type ExtractAllPossibleObjectValidators<T> = {
  [K in keyof T]: T[K] extends PrimitiveValueObject
    ? ValidatorWithDescription<T[K], string>
    : never;
}[keyof T];

/**
 * Represents the validators for an object value object.
 * Allows forAll, byMember and byGroup validators.
 *
 * @typeParam T - The type of the value object.
 *
 * @internal
 */
type ObjectValidators<T> = {
  forAll?: readonly ExtractAllPossibleObjectValidators<T>[];
  byMember?: {
    [K in keyof T]?: readonly ValidatorWithDescription<T[K], string>[];
  };
  byGroup?: readonly {
    group: readonly (keyof T)[];
    validator: ExtractAllPossibleObjectValidators<T>['validator'];
    description: string;
  }[];
};

/**
 * Represents all possible validators for a value object.
 * If T is a primitive type, only forAll validators are allowed.
 * If T is an object type, all validator types are allowed.
 *
 * @typeParam T - The type of the value object.
 *
 * @public
 */
type ValueObjectValidators<T> = T extends PrimitiveValueObject
  ? PrimitiveValidators<T>
  : ObjectValidators<T>;

/**
 * Generic base class for value objects.
 *
 * @typeParam T - The type of the value object.
 *
 * @public
 */
class ValueObject<T> {
  public readonly value: T;
  public static validators: ValueObjectValidators<ExplicitAny>;

  /**
   * Initializes a new instance of the Value Object class.
   * The constructor is protected to enforce creation through static factory methods
   * that handle validation and transformation.
   * It applies a deep freeze to the provided value to ensure immutability.
   *
   * @param value - The value to encapsulate.
   *
   * @internal
   */
  protected constructor(value: T) {
    this.value = deepFreeze(value);
  }

  // *********************************************************************************************
  // Public instance methods.
  // *********************************************************************************************

  /**
   * Checks if this Value Object is structurally equal to another Value Object.
   * Equality is based on the encapsulated value, not object identity.
   * It performs a deep equality check for objects and arrays.
   *
   * @param other - The other Value Object to compare against.
   * @returns `true` if the Value Objects are considered equal, `false` otherwise.
   *
   * @public
   */
  public equals(other?: ValueObject<T>): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    if (other.constructor !== this.constructor) {
      return false;
    }
    return internalDeepEqual(this.value, other.value);
  }

  /**
   * Returns a string representation of the Value Object's encapsulated value.
   *
   * @returns A string representation.
   *
   * @public
   */
  public toString(): string {
    if (this.value === null || this.value === undefined) {
      return '';
    }
    if (typeof this.value === 'string') {
      return this.value;
    }
    try {
      return JSON.stringify(this.value);
    } catch {
      return String(this.value);
    }
  }

  /**
   * Returns the primitive or plain object representation of the Value Object's value,
   * suitable for JSON serialization.
   *
   * @returns The underlying value (`this.value`).
   *
   * @public
   */
  public toJSON(): T {
    return this.value;
  }

  // *********************************************************************************************
  // Public static methods.
  // *********************************************************************************************

  /**
   * Creates a new instance of the Value Object class.
   *
   * @typeParam T - The type of the value object.
   * @typeParam C - The type of the class constructor.
   * @param value - The value to encapsulate.
   * @returns A new instance of the Value Object class.
   *
   * @public
   */
  public static create<T, C extends typeof ValueObject<T>>(
    this: C,
    value: T,
  ): Pipeline<ValueObject<T>, ExtractAllErrorTypes<T, C['validators']>> {
    const { forAll, byMember, byGroup } = this.validators;
    const validationFunctions: Pipeline<unknown, string>[] = [];

    // Assume that the value is a primitive type.
    let isPrimitive = true;

    if (value && typeof value === 'object') {
      // Raise an error if the byMember validators keys are not found in the value.
      if (byMember) {
        const byMembersKeys = Object.keys(byMember) as Array<keyof T>;
        const invalidMember = byMembersKeys.find((key) => !(key in value));

        if (invalidMember) {
          throw new Error(`Member "${String(invalidMember)}" not found in value object`);
        }
      }

      // Validate that all group members exist in the value.
      if (byGroup) {
        for (const { group } of byGroup) {
          const invalidGroupMember = group.find((key) => !(key in value));
          if (invalidGroupMember) {
            throw new Error(
              `Group member "${String(invalidGroupMember)}" not found in value object`,
            );
          }
        }
      }

      isPrimitive = false;
    }

    if (isPrimitive && (byMember || byGroup)) {
      throw new Error(
        'ByMember and byGroup validators are not allowed for primitive types: Use forAll validators instead',
      );
    }

    // Apply forAll validators
    if (forAll) {
      for (const { validator, description } of forAll) {
        // If the value is an object, we need to apply the validator to each key.
        if (value && typeof value === 'object') {
          for (const key of Object.keys(value)) {
            const anonymousFn = () => validator(value[key as keyof T]);
            validationFunctions.push(
              Pipeline.fromFunction(anonymousFn, `${description} (applied to ${String(key)})`),
            );
          }
        } else {
          const anonymousFn = () => validator(value);
          validationFunctions.push(Pipeline.fromFunction(anonymousFn, description));
        }
      }
    }

    // Apply byMember validators.
    if (!isPrimitive && byMember) {
      const memberValidators = Object.entries(byMember) as [
        keyof T,
        ValidatorWithDescription<T[keyof T], string>[],
      ][];

      for (const [key, validators] of memberValidators) {
        const valueToValidate = value[key];

        for (const { validator, description } of validators) {
          const anonymousFn = () => validator(valueToValidate);
          validationFunctions.push(
            Pipeline.fromFunction(anonymousFn, `${description} (applied to ${String(key)})`),
          );
        }
      }
    }

    // Apply byGroup validators.
    if (!isPrimitive && byGroup) {
      for (const { group, validator, description } of byGroup) {
        for (const key of group) {
          const valueToValidate = value[key as keyof T];
          const anonymousFn = () => validator(valueToValidate);
          validationFunctions.push(
            Pipeline.fromFunction(anonymousFn, `${description} (applied to ${String(key)})`),
          );
        }
      }
    }

    return Pipeline.all(validationFunctions, `Run validations for ${this.name}`)
      .step(`Create a new ${this.name} value object`)
      .map(() => new this(value)) as Pipeline<
      ValueObject<T>,
      ExtractAllErrorTypes<T, C['validators']>
    >;
  }
}

export { ValueObject };
export type { ValueObjectValidators };
