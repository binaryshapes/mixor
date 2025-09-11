/**
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { type Value } from '../schema';
import { type Component, component, isComponent } from '../system';
import type { Any, PrimitiveTypeExtended } from '../utils';

/**
 * Defines the struct values.
 *
 * @remarks
 * The fields must be a value type.
 *
 * @internal
 */
type StructValues = Record<string, Value<Any, Any>>;

/**
 * Helper type to extract the value type of each field in the struct values.
 *
 * @typeParam Values - The values.
 *
 * @internal
 */
type StructTypes<Values extends StructValues> = {
  [key in keyof Values]: Values[key]['Type'];
};

/**
 * Helper type to create setter methods for each field in the struct.
 *
 * @remarks
 * Generates setter methods following the pattern `set{FieldName}` for each field
 * in the struct, allowing fluent API usage.
 *
 * @typeParam InferredShape - The inferred shape.
 * @typeParam Values - The values.
 *
 * @internal
 */
type StructMethods<InferredShape extends StructValues> = {
  [key in keyof InferredShape as `set${Capitalize<string & key>}`]: <Self>(
    this: Self,
    value: InferredShape[key],
  ) => Self;
};

/**
 * The struct shape type.
 *
 * @typeParam Values - The values.
 * @typeParam Code - The code.
 *
 * @public
 */
type StructShape<Values extends StructValues, Code extends string> = {
  code: Code;
} & StructTypes<Values> &
  StructMethods<StructTypes<Values>>;

/**
 * The struct component is a factory function that returns a struct shape based on the
 * given values and code.
 *
 * @public
 */
type Struct<Tag extends string, Shape extends StructShape<Any, Any>> = Component<
  Tag,
  {
    (): Shape;
  },
  {
    [K in keyof Shape as Shape[K] extends PrimitiveTypeExtended ? K : never]: Shape[K];
  }
>;

/**
 * Struct builder function that creates struct components with specific codes.
 *
 * @remarks
 * This is a higher-order function that takes struct values and returns a builder
 * function capable of creating struct components with different codes.
 *
 * @typeParam Values - The struct values.
 * @typeParam Code - The data code.
 *
 * @internal
 */
type StructBuilder<Values extends StructValues> = <Tag extends string, Code extends string>(
  code: Code,
) => Struct<Tag, StructShape<Values, Code>>;

/**
 * Creates a struct component.
 *
 * @remarks
 * A struct is a {@link Component} object composed by a list of fields. It is useful to create a
 * structured data object.
 *
 * @typeParam Tag - The struct tag.
 * @typeParam Values - The struct values.
 * @param tag - The struct tag.
 * @param values - The struct values.
 * @returns A function to create a struct component with the given values.
 *
 * @public
 */
const struct = <Tag extends string, Values extends StructValues>(tag: Tag, values: Values) => {
  // The struct function is a factory function that creates a struct component.
  const structFn = <Code extends string>(code: Code) => {
    const data = { code };

    Object.entries(values).forEach(([key]) => {
      Object.defineProperty(data, key, {
        value: null,
        writable: true,
        configurable: true,
        enumerable: true,
      });

      Object.defineProperty(data, `set${key.charAt(0).toUpperCase()}${key.slice(1)}`, {
        value: (value: Any) => {
          data[key as keyof typeof data] = value;
          return data;
        },
        writable: true,
        configurable: true,
      });
    });

    // The component is created with the context.
    return component(tag, () => data, values, code);
  };

  return structFn as unknown as StructBuilder<Values>;
};

/**
 * Checks if the given object is a struct component.
 *
 * @param maybeStruct - The object to check.
 * @param code - The expected code to match against the struct component.
 * @returns True if the object is a struct component with the specified code, false otherwise.
 *
 * @public
 */
const isStruct = (
  maybeStruct: Any,
  code: string,
): maybeStruct is Struct<Any, StructShape<Any, Any>> => isComponent(maybeStruct, code);

export { isStruct, struct };
export type { Struct, StructShape };
