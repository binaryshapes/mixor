/**
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import util from 'util';

import type { Any } from './generics';
import { Registry, type RegistryInfo, type RegistryTargetSubType } from './registry';

/**
 * Base component metadata.
 *
 * @typeParam Extra - The extra metadata (if necessary).
 *
 * @internal
 */
type ComponentMeta<Extra extends Record<string, Any> = Record<never, never>> = {
  readonly context: string;
  readonly name: string;
  readonly description: string;
} & Extra;

/**
 * Defines the possible targets for a component.
 *
 * @remarks
 * A component target can be an object or a function.
 *
 * @internal
 */
type ComponentTarget = Record<string, Any> | ((...args: Any[]) => Any);

/**
 * A component is the most elementary object in the system.
 *
 * @typeParam Tag - The tag of the component.
 * @typeParam Target - The target of the component.
 * @typeParam Extra - The extra metadata (if necessary).
 * @typeParam Type - The inferred type of the component (if necessary).
 *
 * @public
 */
type Component<
  Tag extends string,
  Target extends ComponentTarget,
  Extra extends Record<string, Any> = Record<never, never>,
  Type = Target,
> =
  // Adding all component builder methods to the component.
  ComponentBuilder<Tag, Target, Extra> &
    // Ensuring have the original target type.
    Target &
    // Type definition for the component.
    {
      /**
       * The inferred type of the component.
       *
       * @remarks
       * This is only for typing inference. In runtime this is not defined.
       */
      Type: Type;
    };

/**
 * A component builder with all related methods.
 *
 * @remarks
 * A component is a wrapper around an object or a function. It is used to
 * register the object or function in the central registry and to provide
 * metadata about the object or function.
 *
 * @typeParam Tag - The tag of the component.
 * @typeParam Target - The target of the component.
 * @typeParam Extra - The extra metadata (if necessary).
 * @typeParam Type - The inferred type of the component (if necessary).
 *
 * @public
 */
class ComponentBuilder<
  Tag extends string,
  Target,
  Extra extends Record<string, Any> = Record<never, never>,
> {
  /**
   * Instantiates a new component, registering it in the central registry.
   *
   * @param tag - The tag of the component.
   * @param target - The target of the component.
   * @param uniqueness - The uniqueness attributes of the target.
   */
  private constructor(tag: Tag, target: Target, uniqueness: Any) {
    Registry.add(target, tag, uniqueness);
  }

  /**
   * Get the info related to the component.
   *
   * @remarks
   * The info is frozen to prevent modifications and extensions.
   *
   * @returns The component data information.
   */
  public get info() {
    return Registry.get(this);
  }

  /**
   * Get the dependency tree of the component.
   *
   * @returns The dependency tree of the component and its children.
   */
  public get tree() {
    return Registry.tree(this.info.id);
  }

  /**
   * Set/Override the component metadata.
   *
   * @param meta - The metadata to set.
   * @returns The component for method chaining.
   */
  public meta(meta: ComponentMeta<Extra>) {
    Registry.set(this, { meta } as unknown as RegistryInfo<Tag, ComponentMeta<Extra>>);
    return this;
  }

  /**
   * Add the given children to the component.
   *
   * @remarks
   * This method merges existing children with the new ones. New children overrides
   * existing children. In normal cases, you should not use this method.
   *
   * @param children - The children components to add.
   * @returns The component for method chaining.
   */
  public addChildren(...children: ComponentBuilder<Any, Any, Any>[]) {
    Registry.set(this, {
      childrenIds: [
        // The existing children.
        ...Registry.get(this).childrenIds,
        // The new children.
        ...children.map((child) => (Registry.get(child) ?? Registry.get(child)).id),
      ],
    } as unknown as RegistryInfo<Tag, ComponentMeta<Extra>>);
    return this;
  }

  /**
   * Set the sub type of the component.
   *
   * @remarks
   * This info could be used to introspect the component, but does not affect the behavior of
   * the component.
   *
   * @param type - The sub type to set.
   * @returns The component for method chaining.
   */
  public subType(type: RegistryTargetSubType) {
    Registry.set(this, { subType: type } as unknown as RegistryInfo<Tag, ComponentMeta<Extra>>);
    return this;
  }

  /**
   * Creates a new component, registering into the central registry.
   *
   * @param tag - The tag of the component.
   * @param target - The target of the component.
   * @param uniqueness - The uniqueness attributes of the target.
   * @returns The new component.
   */
  static create(tag: string, target: Any, uniqueness: Any) {
    const component = new ComponentBuilder(tag, target, uniqueness);

    // Adding the component to the target and changing the name.
    combine(target, component);
    Object.defineProperty(target, 'name', { value: tag });
    Object.defineProperty(target.constructor, 'name', { value: tag });

    // Fancy log.
    (target as Any)[util.inspect.custom] = () => `Component<${tag}>: ${target.info.id}`;

    return target;
  }
}

/**
 * Combines the target into the component.
 *
 * @param target - The target to combine.
 * @param component - The component builder to combine.
 *
 * @internal
 */
const combine = (target: ComponentTarget, component: ComponentBuilder<Any, Any, Any>) => {
  // Adding to the target all component properties.
  Object.assign(target, component);

  // Copying all component prototype properties to the target.
  const proto = Object.getPrototypeOf(component);
  Object.getOwnPropertyNames(proto).forEach((name) => {
    if (name !== 'constructor') {
      const descriptor = Object.getOwnPropertyDescriptor(proto, name);
      if (descriptor) {
        Object.defineProperty(target, name, descriptor);
      }
    }
  });
};

/**
 * Creates a new component, registering into the central registry.
 *
 * @param tag - The tag of the component.
 * @param target - The target of the component.
 * @param uniqueness - The uniqueness attributes of the target.
 * @returns The new component.
 *
 * @public
 */
const component = <
  Tag extends string,
  Target extends ComponentTarget,
  Extra extends Record<string, Any> = Record<never, never>,
  InferedType = Target,
>(
  tag: Tag,
  target: Target,
  uniqueness?: Any,
) => ComponentBuilder.create(tag, target, uniqueness) as Component<Tag, Target, Extra, InferedType>;

/**
 * Checks if the given object is a component of the given tag.
 *
 * @param maybeComponent - The value to check.
 * @param tag - The tag of the component.
 * @returns True if the value is a component, false otherwise.
 *
 * @public
 */
const isComponent = (maybeComponent: Any, tag?: string): maybeComponent is Component<Any, Any> =>
  Registry.exists(maybeComponent) && (tag ? Registry.get(maybeComponent).tag === tag : true);

export { component, isComponent };
export type { Component };
