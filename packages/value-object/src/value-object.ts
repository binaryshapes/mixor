/*
 * This file is part of the Daikit project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { Pipeline } from '@daikit/result';
import type {
  ValidatorList,
  ValidatorListErrors,
  ValidatorMap,
  ValidatorMapErrors,
} from '@daikit/validation';

/**
 * A type that is used to justify the use of any in value object contexts.
 * It is used to avoid type errors when using the any type through the codebase.
 *
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ValueObjectAny = any;

/**
 * Placeholder for a deep freeze function.
 *
 * @remarks
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
      deepFreeze((obj as ValueObjectAny)[prop]);
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
function internalDeepEqual(a: ValueObjectAny, b: ValueObjectAny): boolean {
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
 * Represents a unified validator structure for Value Objects.
 * For primitive types, only 'all' is allowed and 'byField' is optional.
 * For composite types, both 'all' and 'byField' are optional.
 *
 * @typeParam T - The type of the value object.
 * @typeParam V - The type of the validators.
 * @typeParam FV - The type of the field validators.
 *
 * @internal
 */
type ValueObjectValidators<
  T,
  V extends ValidatorList<T>,
  FV extends ValidatorMap<T>,
> = T extends PrimitiveValueObject
  ? {
      all: V;
      byField?: never;
    }
  : {
      all?: V;
      byField?: FV;
    };

/**
 * Represents the constructor of a Value Object to be used in the {@link ValueObject.create} method.
 *
 * @typeParam T - The type of the value object.
 * @typeParam V - The type of the validators.
 * @typeParam FV - The type of the field validators.
 *
 * @internal
 */
type ValueObjectConstructor<T, V extends ValidatorList<T>, FV extends ValidatorMap<T>> = {
  new (value: T): ValueObject<T>;
  validators: ValueObjectValidators<T, V, FV>;
};

/**
 * Represents the type of a validator field in the Value object.
 * If T is a primitive type, the validator will be an array of validators.
 * Otherwise, if is record or nested object, the validator will be a ValidatorMap<T> object.
 *
 * @typeParam T - The type of the value object.
 * @typeParam V - The type of the validators.
 * @typeParam FV - The type of the field validators.
 *
 * @internal
 */
type ValueObjectError<
  T,
  V extends ValidatorList<T>,
  FV extends ValidatorMap<T>,
> = T extends PrimitiveValueObject ? ValidatorListErrors<V> : ValidatorMapErrors<FV>;

/**
 * Generic base class for value objects.
 *
 * @typeParam T - The type of the value object.
 *
 * @public
 */
abstract class ValueObject<T> {
  public readonly value: T;
  public static readonly validators: ValueObjectValidators<
    ValueObjectAny,
    ValidatorList<ValueObjectAny>,
    ValidatorMap<ValueObjectAny>
  > = {
    all: [],
    byField: {},
  };

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
  constructor(value: T) {
    this.value = deepFreeze(value);
  }

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

  /**
   * Creates a new instance of the Value Object class.
   *
   * @typeParam T - The type of the value object.
   * @typeParam V - The type of the validators.
   * @typeParam FV - The type of the field validators.
   * @param value - The value to encapsulate.
   * @returns A new instance of the Value Object class.
   *
   * @public
   */
  static create<T, V extends ValidatorList<T>, FV extends ValidatorMap<T>>(
    this: ValueObjectConstructor<T, V, FV>,
    value: T,
  ): Pipeline<InstanceType<typeof this>, ValueObjectError<T, V, FV>> {
    const {
      validators: { all = undefined, byField = undefined },
    } = this;

    // Asume that the value is a primitive type.
    let isPrimitive = true;
    const validationFunctions: Pipeline<void, string>[] = [];

    if (value && typeof value === 'object') {
      // Raise an error if the byField validators keys are not found in the value.
      if (byField) {
        const byFieldsKeys = Object.keys(byField);
        const invalidField = byFieldsKeys.find((key) => !(key in value));

        // TODO: this is working only in runtime.
        // We need to check this in compile time with typescript.
        if (invalidField) {
          throw new Error(`Field "${String(invalidField)}" not found in value`);
        }
      }
      isPrimitive = false;
    }

    if (isPrimitive && byField) {
      throw new Error('ByField validators are not allowed for primitive types.');
    }

    // For both cases, apply all validators.
    if (all) {
      for (const validator of all) {
        if (value && typeof value === 'object') {
          const valueKeys = Object.keys(value) as (keyof T)[];
          for (const key of valueKeys) {
            const fieldValue = value[key] as T;
            const result = () => validator(fieldValue);
            validationFunctions.push(Pipeline.from(result));
          }
        } else {
          const result = () => validator(value);
          validationFunctions.push(Pipeline.from(result));
        }
      }
    }

    // Collecting all validators.
    if (!isPrimitive && byField) {
      const fieldValidators = Object.entries(byField) as [keyof T, ValidatorList<T>][];

      for (const [key, validator] of fieldValidators) {
        const valueToValidate = value[key as keyof T] as T;

        validator.forEach((v) => {
          const anonymusFn = () => v(valueToValidate);
          validationFunctions.push(Pipeline.from(anonymusFn));
        });
      }
    }

    // The pipeline is created with the validation functions.
    return Pipeline.all(validationFunctions).map(() => new this(value)) as Pipeline<
      InstanceType<typeof this>,
      ValueObjectError<T, V, FV>
    >;
  }
}

export { ValueObject };
