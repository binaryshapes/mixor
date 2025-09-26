/**
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { type Any, type Prettify, merge, setInspect } from '../utils';
import { Logger } from './logger';
import { Panic } from './panic';
import { type Register, type Registrable, Registry } from './registry';

/**
 * Component info type.
 *
 * @typeParam MetaExtra - The extra metadata (if necessary).
 *
 * @internal
 */
type ComponentInfo<MetaExtra extends Record<string, Any> = Record<never, never>> = {
  /**
   * Child components identifiers.
   */
  childrenIds: string[];

  /**
   * Traced flag of the component. If true, the component will be traced.
   */
  traced: boolean;

  /**
   * Type of the component.
   *
   * @remarks
   * It is used to type introspection of the component in runtime.
   */
  type: string;

  /**
   * Metadata of the component.
   */
  meta: Prettify<
    {
      /**
       * Context where the component is used.
       */
      context: string;

      /**
       * Human-readable name of the component.
       */
      name: string;

      /**
       * Description of the component's purpose.
       */
      description: string;
    } & MetaExtra
  >;
};

/**
 * Represents a node in the registry object dependency tree.
 *
 * @typeParam T - The object type.
 *
 * @internal
 */
type ComponentTreeNode<T> = {
  /**
   * The object instance.
   */
  readonly self: T;

  /**
   * Child nodes in the tree.
   */
  readonly children: ComponentTreeNode<T>[];

  /**
   * Depth level in the tree (0 for root).
   */
  readonly depth: number;

  /**
   * Path from root to this node.
   */
  readonly path: string[];
};

/**
 * Represents a component.
 *
 * @remarks
 * Exposes all properties, methods and types of the component for the given target.
 *
 * @typeParam Tag - The tag of the component.
 * @typeParam Target - The target of the component.
 * @typeParam Type - The type of the component.
 * @typeParam MetaExtra - The extra metadata (if necessary).
 *
 * @public
 */
type Component<
  Tag extends string,
  Target extends Registrable,
  Type = Target,
  MetaExtra extends Record<string, Any> = Record<never, never>,
> = { Type: Type; Tag: Tag } & Target &
  ComponentBuilder<Tag, Target, MetaExtra> &
  Register<Target, Any>;

/**
 * Panic error for the component module.
 *
 * - NotFound - Raised when a component was not found in the register.
 *
 * @public
 */
class ComponentError extends Panic<'Component', 'NotFound'>('Component') {}

/**
 * Represents a component builder.
 *
 * @remarks
 * This class is used to build a component.
 *
 * @typeParam Tag - The tag of the component.
 * @typeParam Target - The target of the component.
 * @typeParam MetaExtra - The extra metadata (if necessary).
 *
 * @internal
 */
class ComponentBuilder<
  Tag extends string,
  Target extends Registrable,
  MetaExtra extends Record<string, Any> = Record<never, never>,
> {
  // Fixed name of the component builder.
  public static name = 'Component';

  /**
   * Unique id of the component.
   * This id is generated based on the tag, the register id and the reference count.
   */
  public readonly id: string;

  /**
   * Tag of the component. Should be the same as the tag of the register.
   */
  public readonly tag: Tag;

  /**
   * Constructor of the component builder.
   *
   * @param register - The register related to the component.
   */
  public constructor(register: Register<Target, Any>) {
    register.refCount++;
    this.tag = register.tag;
    this.id = `${register.tag.toLowerCase()}:${register.registerId}:${register.refCount}`;
  }

  /**
   * Set/Override the component metadata.
   *
   * @param meta - The metadata to set.
   * @returns The component for method chaining.
   */
  public meta(meta: ComponentInfo<MetaExtra>['meta']) {
    Registry.info.set(this.id, { ...this.info, meta: { ...this.info?.meta, ...meta } });
    return this;
  }

  /**
   * Add the given children components to the component. Necessary for dependency tree building.
   *
   * @param children - The children components to add.
   * @returns The component for method chaining.
   */
  public addChildren(...children: Component<Any, Any>[]) {
    const invalid = children.filter((val) => !isComponent(val));

    Logger.assert(invalid.length === 0, 'All children must be components');

    Registry.info.set(this.id, {
      ...this.info,
      childrenIds: [
        ...(this.info?.childrenIds ?? []),
        ...children.filter((val) => isComponent(val)).map((c) => c.id),
      ],
    });
    return this;
  }

  /**
   * Set the type of the component.
   *
   * @param type - The type to set.
   * @returns The component for method chaining.
   */
  public type(type: string) {
    Registry.info.set(this.id, { ...this.info, type });
    return this;
  }

  /**
   * Set the traced flag of the component.
   *
   * @remarks
   * This activates the internal tracing system of the component.
   *
   * @param traced - The traced flag to set.
   * @returns The component for method chaining.
   */
  public traced(traced: boolean) {
    Registry.info.set(this.id, { ...this.info, traced });
    return this;
  }

  /**
   * Get the info related to the component.
   *
   * @returns The component data information.
   */
  public get info() {
    return Registry.info.get(this.id) as unknown as ComponentInfo<MetaExtra>;
  }

  /**
   * Build a dependency tree for the given component id.
   *
   * @returns A tree node representing the component and its dependencies.
   */
  public tree() {
    return ComponentBuilder.buildTree(this.id) as ComponentTreeNode<
      Prettify<ComponentInfo<MetaExtra>>
    >;
  }

  /**
   * Build a dependency tree for the given component id.
   *
   * @param id - The ID of the component to build the tree for.
   * @param depth - Current depth in the tree.
   * @param path - Current path from root.
   * @param visited - Set of visited component IDs to prevent cycles.
   * @returns A tree node representing the component and its dependencies.
   */
  private static buildTree(
    id: string,
    depth = 0,
    path: string[] = [],
    visited: Set<string> = new Set(),
  ): ComponentTreeNode<Any> {
    const info = Registry.info.get(id);

    if (!info) {
      throw new ComponentError('NotFound', 'Component not found');
    }

    // Prevent infinite recursion in case of circular dependencies.
    if (visited.has(id)) {
      return {
        self: info,
        children: [],
        depth,
        path: [...path, id],
      } satisfies ComponentTreeNode<Any>;
    }

    visited.add(id);
    const currentPath = [...path, id];

    // Build children trees.
    const children = info.childrenIds
      ? info.childrenIds
          .map((childId: string) => {
            const childTarget = Registry.info.get(childId);

            // This should never happen, but we assert it to be sure.
            Logger.assert(
              !!childTarget,
              `Child target not found: ${childId}. Maybe you tree is corrupted.`,
            );

            // Build the child tree.
            return ComponentBuilder.buildTree(childId, depth + 1, currentPath, visited);
          })
          .filter(
            (child: ComponentTreeNode<Any> | null): child is ComponentTreeNode<Any> =>
              child !== null,
          )
      : [];

    return {
      self: info,
      children,
      depth,
      path: currentPath,
    };
  }
}

/**
 * Creates a new component for the given registry item.
 *
 * @typeParam Tag - The tag of the component.
 * @typeParam Target - The target of the component.
 * @typeParam Extra - The extra metadata (if necessary).
 *
 * @param tag - The tag of the component.
 * @param target - The target of the component.
 * @param uniqueness - The uniqueness of the component.
 * @returns The new component.
 *
 * @public
 */
const component = <
  Tag extends string,
  Target extends Registrable,
  Extra extends Record<string, Any> = Record<never, never>,
>(
  tag: Tag,
  target: Target,
  ...uniqueness: Registrable[]
) => {
  const reg = Registry.create(target, tag, ...uniqueness);
  const com = new ComponentBuilder(reg);

  // Merge the target, the register, the component and the uniqueness as a single object.
  const tar = merge(target, reg, com, ...uniqueness);

  // Fancy inspect.
  setInspect(target, () => ({
    ...com,
    ...Object.entries(reg)
      .filter(([key]) => key !== 'target')
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {}),
    ...com.info,
  }));

  // This is a workaround to avoid the native code being included in the hash.
  Object.defineProperty(target, 'toString', {
    value: () => com.id,
  });

  return tar as Component<Tag, Target, Extra>;
};

/**
 * Guard function to check if the given object is a component.
 *
 * @param maybeComponent - The object to check.
 * @param tag - The tag to check the component against (optional).
 * @returns True if the object is a component, false otherwise.
 *
 * @public
 */
const isComponent = (maybeComponent: Any, tag?: string): maybeComponent is Component<Any, Any> =>
  // Should have a register id and be in the registry.
  !!maybeComponent.registerId &&
  Registry.catalog.has(maybeComponent.registerId) &&
  // Should have a tag and it should match the given tag.
  (tag && !!maybeComponent.tag ? maybeComponent.tag === tag : true);

export { ComponentError, component, isComponent };
export type { Component };
