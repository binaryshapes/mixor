/*
 * This file is part of the Daikit project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Represents a value that may or may not exist.
 * Similar to Rust's Option or Scala's Option, it can be either Some(value) or None.
 *
 * @typeParam T - The type of the value that may exist.
 *
 * @public
 */
type Option<T> = Some<T> | None;

/**
 * Represents the presence of a value of type `T`.
 *
 * @public
 */
type Some<T> = {
  /**
   * The value that exists.
   */
  readonly value: T;
  /**
   * Discriminator tag for the Some variant.
   */
  readonly _tag: 'Some';
};

/**
 * Represents the absence of a value.
 *
 * @public
 */
type None = {
  /**
   * Discriminator tag for the None variant.
   */
  readonly _tag: 'None';
};

/**
 * Creates an `Option` representing the presence of a value.
 *
 * @param value - The value to wrap in Some.
 * @returns An `Option` instance representing Some(value).
 *
 * @public
 */
function some<T>(value: T): Option<T> {
  return { value, _tag: 'Some' };
}

/**
 * Creates an `Option` representing the absence of a value.
 *
 * @returns An `Option` instance representing None.
 *
 * @public
 */
function none(): Option<never> {
  return { _tag: 'None' };
}

/**
 * Checks if an `Option` is a `Some`.
 *
 * @param option - The `Option` to check.
 * @returns `true` if the `Option` is a `Some`, `false` otherwise.
 *
 * @public
 */
function isSome<T>(option: Option<T>): option is Some<T> {
  return option._tag === 'Some';
}

/**
 * Checks if an `Option` is a `None`.
 *
 * @param option - The `Option` to check.
 * @returns `true` if the `Option` is a `None`, `false` otherwise.
 *
 * @public
 */
function isNone<T>(option: Option<T>): option is None {
  return option._tag === 'None';
}

/**
 * Checks if any value is an `Option` type.
 *
 * @param value - The value to check.
 * @returns `true` if the value is an `Option` type, `false` otherwise.
 *
 * @public
 */
function isOption(value: unknown): value is Option<unknown> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  return (
    ('_tag' in value && value._tag === 'Some' && 'value' in value) ||
    ('_tag' in value && value._tag === 'None')
  );
}

/**
 * Wraps a value of type T into an Option<T>, removing undefined from the type.
 * If the value is undefined, returns None, otherwise returns Some(value).
 *
 * @param value - The value to transform into an Option
 * @returns An Option containing the value if it exists, None otherwise
 *
 * @public
 */
const wrapOption = <T>(value: T | undefined): Option<Exclude<T, undefined>> =>
  value === undefined ? none() : some(value as Exclude<T, undefined>);

/**
 * Unwraps an `Option`, returning the value if it exists or a default value if it doesn't.
 *
 * @param option - The `Option` to unwrap.
 * @param defaultValue - The value to return if the `Option` is `None`.
 * @returns The value inside the `Option` if it exists, or the default value.
 *
 * @public
 */
const unwrapOption = <T>(option: Option<T>, defaultValue?: T) =>
  isSome(option) ? option.value : (defaultValue ?? (undefined as T));

export type { None, Option, Some };
export { unwrapOption, wrapOption, isNone, isOption, isSome, none, some };
