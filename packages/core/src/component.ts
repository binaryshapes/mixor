/**
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Any } from './generics.ts';
import { isRegistered, type Register, registry } from './registry.ts';

/**
 * A generic component type that combines a target object with registry metadata.
 *
 * Components are the core building blocks of the system, providing a way to
 * associate metadata and behavior with any target object through a tag-based
 * registration system.
 *
 * @typeParam Tag - A string identifier that uniquely categorizes the component type.
 * @typeParam Target - The underlying object or data structure that the component wraps.
 * @typeParam Type - The type information associated with the component (defaults to Target).
 * @typeParam Extra - Additional metadata properties that can be attached to the component.
 *
 * @public
 */
type Component<
  Tag extends string,
  Target,
  Type = Target,
  Extra extends Record<string, Any> = Record<never, never>,
> =
  & Target
  & Register<Tag, Extra>
  & { Type: Type };

/**
 * Factory function that creates a new component by registering the given target object.
 *
 * This function takes a tag identifier, a target object, and optional uniqueness
 * parameters to create a component that combines the target with registry metadata.
 * The resulting component can be used throughout the system for type-safe operations.
 *
 * @param tag - A string identifier that categorizes the type of component being created.
 * @param target - The object or data structure to wrap as a component.
 * @param uniqueness - Optional parameters that ensure component uniqueness in the registry.
 * @returns A new component that combines the target with registry metadata.
 *
 * @public
 */
const component = <
  Tag extends string,
  Target,
  Extra extends Record<string, Any> = Record<never, never>,
>(tag: Tag, target: Target, ...uniqueness: Any[]) =>
  registry.create(tag, target, ...uniqueness) as Component<Tag, Target, Extra>;

/**
 * Type guard function that determines whether an object is a valid component.
 *
 * This function performs runtime validation to check if an object has the
 * necessary properties to be considered a component. It verifies the presence
 * of required registry metadata and optionally validates against a specific tag.
 *
 * @param maybeComponent - The object to validate as a potential component.
 * @param tag - Optional tag to match against the component's tag property.
 * @returns True if the object is a valid component, false otherwise.
 *
 * @public
 */
const isComponent = (maybeComponent: Any, tag?: string): maybeComponent is Component<Any, Any> => (
  // Should have a registry record.
  isRegistered(maybeComponent) &&
  // Should have a tag and it should match the given tag.
  (tag && !!maybeComponent.tag ? maybeComponent.tag === tag : true)
);

export { component, isComponent };
export type { Component };
