/**
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { type Component, component, isComponent } from '../component';
import type { Any } from '../generics';
import { type Value } from './value';

/**
 * Defines the struct shape using the value type to infer the real types of each field.
 *
 * @typeParam S - The shape.
 *
 * @internal
 */
type StructShape<S extends Record<string, Value<Any, Any>>> = {
  [key in keyof S]: S[key]['Type'];
};

/**
 * Defines the struct methods based on the shape.
 *
 * @typeParam Context - The context.
 * @typeParam Code - The code.
 * @typeParam Shape - The shape.
 *
 * @internal
 */
type StructMethods<Context extends string, Code extends string, Shape extends StructShape<Any>> = {
  [key in keyof Shape as `set${Capitalize<string & key>}`]: (
    value: Shape[key],
  ) => Struct<Context, Code, Shape>;
};

/**
 * Defines the struct tag based on the context.
 *
 * @typeParam Context - The context.
 *
 * @internal
 */
type StructTag<Context extends string> = `Struct${Capitalize<Context>}`;

/**
 * Struct component.
 *
 * @typeParam Code - The data code.
 *
 * @public
 */
type Struct<
  Context extends string,
  Code extends string,
  Shape extends StructShape<Any> = Record<never, never>,
> = Component<
  // Dynamic tag.
  StructTag<Context>,
  { context: Context; code: Code } & StructShape<Shape> &
    StructMethods<Context, Code, StructShape<Shape>>,
  { example: StructShape<Shape> },
  StructShape<Shape>
>;

/**
 * Creates a struct tag.
 *
 * @param tag - The struct tag.
 * @returns The struct tag.
 *
 * @internal
 */
const structTag = (tag: string) => `Struct${tag.charAt(0).toUpperCase()}${tag.slice(1)}`;

/**
 * Creates a data component.
 *
 * @typeParam Shape - The data shape.
 * @param shape - The data shape.
 * @returns A function to create a data component with the given shape.
 *
 * @public
 */
const struct = <Shape extends StructShape<Any>>(shape: Shape = {} as Shape) => {
  // The struct function is a factory function that creates a struct component.
  const st = <Context extends string, Code extends string>(context: Context, code: Code) => {
    const data = {
      code,
      context,
    };

    Object.entries(shape).forEach(([key]) => {
      Object.defineProperty(data, key, {
        value: null,
        writable: true,
        configurable: true,
      });

      Object.defineProperty(data, `set${key.charAt(0).toUpperCase()}${key.slice(1)}`, {
        value: (value: Shape[keyof Shape]) => {
          data[key as keyof typeof data] = value;
          return data;
        },
        writable: true,
        configurable: true,
      });
    });

    // The component is created with the context.
    return component(structTag(context), data, data) as unknown as Struct<Context, Code, Shape>;
  };

  return st;
};

/**
 * Checks if the given object is a struct component.
 *
 * @param maybeStruct - The object to check.
 * @param tag - The struct tag.
 * @returns True if the object is a struct component, false otherwise.
 *
 * @public
 */
const isStruct = (maybeStruct: Any, tag: string): maybeStruct is Struct<Any, Any> =>
  isComponent(maybeStruct, structTag(tag));

export { isStruct, struct };
export type { Struct };
