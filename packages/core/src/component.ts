/*
 * This file is part of the Mixor project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { hash } from './_hash';
import type { Any, Prettify } from './generics';
import { Panic } from './panic';

/**
 * System for managing and categorizing different types of components.
 *
 * A component is a internal representation of a function or an object in the core system.
 * It is used to track the usage of the function or object and to provide extra information.
 *
 * This module provides a comprehensive component management system that allows components to
 * be categorized, traced, and managed throughout their lifecycle. It supports both injectable
 * and non-injectable components with different capabilities and metadata management.
 *
 * @packageDocumentation
 */

/**
 * Array of non-injectable component types.
 *
 * @internal
 */
const nonInjectables = [
  'Object',
  'Builder',
  'Criteria',
  'Value',
  'Rule',
  'Event',
  'Specification',
  'Aggregate',
  'Schema',
  'Command',
  'Query',
] as const;

/**
 * Array of injectable component types.
 *
 * @internal
 */
const injectables = ['Port', 'Adapter', 'Service', 'Container'] as const;

/**
 * Type representing non-injectable component tags.
 *
 * @internal
 */
type ComponentNonInjectable = (typeof nonInjectables)[number];

/**
 * Type representing injectable component tags.
 *
 * @internal
 */
type ComponentInjectable = (typeof injectables)[number];

/**
 * Union type of all possible component tags.
 *
 * @internal
 */
type ComponentTag = ComponentNonInjectable | ComponentInjectable;

/**
 * Type representing the category of a component.
 *
 * @internal
 */
type ComponentCategory = 'function' | 'object';

/**
 * Type representing the sub-type of a component.
 *
 * @internal
 */
type ComponentSubType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'bigint'
  | 'symbol'
  | 'date'
  | 'url'
  | 'array';

/**
 * Metadata structure for components with extensible properties.
 *
 * @typeParam Meta - Additional metadata properties to extend the base metadata.
 *
 * @public
 */
type ComponentMeta<Meta extends Record<string, Any> = object> = Prettify<
  {
    /** Human-readable name of the traced element. */
    readonly name: string;
    /** Description of the element's purpose. */
    readonly description: string;
    /** Scope or context where the element is used. */
    readonly scope: string;
  } & Readonly<Meta>
>;

/**
 * Core data structure for component information.
 *
 * @typeParam Tag - The component tag type.
 * @typeParam Meta - The metadata type for the component.
 *
 * @internal
 */
type ComponentData<Tag extends ComponentTag, Meta extends Record<string, Any> = ComponentMeta> = {
  /** Unique identifier for the component. */
  readonly id: string;

  /** Parent component identifier for hierarchical tracing. */
  readonly parentId: string | null;

  /** Tag identifier for categorization. */
  readonly tag: Tag;

  /** Type of the component. */
  readonly category: ComponentCategory;

  /** Return type of the component. */
  readonly subType: string | null;

  /** Indicates if the component is traceable. */
  readonly traceable: boolean;

  /** Indicates if the component is injectable. */
  readonly injectable: boolean;

  /** Metadata for the component. */
  meta: ComponentMeta<Meta> | null;
};

/**
 * Main component interface with fluent API methods.
 *
 * @typeParam Tag - The component tag type.
 * @typeParam Meta - The metadata type for the component.
 *
 * @public
 */
type Component<Tag extends ComponentTag, Meta extends Record<string, Any> = ComponentMeta> = {
  /**
   * Set/Override the component metadata.
   *
   * @param meta - The metadata to set.
   * @returns The component for method chaining.
   */
  meta: <Self>(this: Self, meta: ComponentMeta<Meta>) => Self;

  /**
   * Set the parent for the component.
   *
   * @param parent - The parent component.
   * @returns The component for method chaining.
   */
  parent: <Self>(this: Self, parent: Component<Any>) => Self;

  /**
   * Make the component traceable.
   *
   * @returns The component for method chaining.
   */
  traceable: <Self>(this: Self) => Self;

  /**
   * Get the info related to the component.
   *
   * @remarks
   * The info is frozen to prevent modifications and extensions.
   *
   * @returns The component data information.
   */
  info: <Self>(this: Self) => ComponentData<Tag, Meta>;
} & (Tag extends ComponentInjectable
  ? {
      /**
       * Mark the component as injectable.
       *
       * @returns The component for method chaining.
       */
      injectable: <Self>(this: Self) => Self;
    }
  : {
      /**
       * Overrides the type of the component.
       *
       * @param type - The type to set.
       * @returns The component for method chaining.
       */
      subType: <Self>(this: Self, type: ComponentSubType) => Self;
    });

/**
 * Error types for component operations.
 *
 * @public
 */
const ComponentError = Panic<
  'COMPONENT',
  // When a component is not found in the registry.
  | 'NOT_FOUND'
  // When a component is already registered.
  | 'ALREADY_REGISTERED'
  // When the target is not a function or an object.
  | 'INVALID_TARGET'
>('COMPONENT');

/**
 * Metadata store for components.
 *
 * @internal
 */
const registry = (() => {
  const store = new WeakMap<object, ComponentData<Any, Any> | object>();
  const catalog = new Map<string, Component<Any, Any>>();

  const self = {
    /**
     * Add a component to the registry.
     *
     * @param component - The component to add.
     * @param data - The initial data for the component.
     * @throws A {@link ComponentError} if the component is already registered.
     *
     * @internal
     */
    add: (component: Any, data: ComponentData<Any, Any>) => {
      if (store.has(component)) {
        throw new ComponentError(
          'ALREADY_REGISTERED',
          'Component with id: ' + data.id + ' already registered.',
        );
      }

      catalog.set(data.id, component);
      store.set(component, data);
    },

    /**
     * Set the data for a component.
     *
     * @remarks
     * Be careful when using this method as it can break the component data.
     * All matches will be overridden.
     *
     * @param component - The component to set the data for.
     * @param newData - The data to set.
     * @throws A {@link ComponentError} if the component is not found in the registry.
     *
     * @internal
     */
    set: (component: Component<Any>, newData: Partial<ComponentData<Any, Any>>) => {
      // Merge the data with the new data. All matches will be overridden.
      store.set(component, { ...self.get(component), ...newData });
    },

    /**
     * Get the data for a component.
     *
     * @param component - The component to get the data for.
     * @returns The data for the component.
     *
     * @internal
     */
    get: (component: Component<Any>) =>
      Object.freeze(store.get(component)) as ComponentData<Any, Any>,

    /**
     * Check if a component exists.
     *
     * @param component - The component to check.
     * @returns True if the component exists, false otherwise.
     *
     * @internal
     */
    exists: (component: Component<Any>) => store.has(component),

    /**
     * Get the catalog of components.
     *
     * @returns The catalog of components.
     *
     * @internal
     */
    catalog,
  };

  return self;
})();

/**
 * Base prototype methods for all components.
 *
 * @param self - The component instance.
 * @returns Object with base prototype methods.
 *
 * @internal
 */
const ComponentBasePrototype = (self: Any) => {
  return {
    meta: (meta: ComponentMeta<Any>) => (registry.set(self, { meta }), self),
    parent: (parent: Component<Any>) => (
      registry.set(self, { parentId: registry.get(parent).id }),
      self
    ),
    traceable: () => (registry.set(self, { traceable: true }), self),
    info: () => registry.get(self),
  };
};

/**
 * Prototype methods for non-injectable components.
 *
 * @param self - The component instance.
 * @returns Object with non-injectable prototype methods.
 *
 * @internal
 */
const NonInjectableComponentPrototype = (self: Any) => {
  return {
    subType: (type: ComponentSubType) => (registry.set(self, { subType: type }), self),
  };
};

/**
 * Prototype methods for injectable components.
 *
 * @param self - The component instance.
 * @returns Object with injectable prototype methods.
 *
 * @internal
 */
const InjectableComponentPrototype = (self: Any) => {
  return {
    injectable: () => (registry.set(self, { injectable: true }), self),
  };
};

/**
 * Main component factory function that creates and registers components.
 *
 * This function takes a tag and target, creates a unique identifier,
 * determines the component category, and applies the appropriate
 * prototype methods based on whether the component is injectable.
 *
 * @typeParam Tag - The component tag type.
 * @typeParam Meta - The metadata type for the component.
 *
 * @param tag - The component tag for categorization.
 * @param target - The target object or function to convert to a component.
 * @returns The enhanced target with component capabilities.
 * @throws A {@link ComponentError} if the target is not a function or object.
 *
 * @example
 * ```ts
 * // component-001: Component function example.
 * const EmailValidator = (email: string) => {
 *   if (!email.includes('@')) {
 *     throw new Error('Invalid email');
 *   }
 *   return email;
 * };
 *
 * const EmailValidatorComponent = component<'Rule', EmailValidatorMeta>(
 *   'Rule',
 *   EmailValidator,
 * ).meta({
 *   scope: 'User',
 *   name: 'EmailValidator',
 *   description: 'Validates an email address',
 *   example: 'example@example.com',
 * });
 * ```
 *
 * @example
 * ```ts
 * // component-002: Component object example.
 * const User = {
 *   name: 'John',
 *   age: 30,
 * };
 *
 * const UserComponent = component<'Object', UserMeta>('Object', User)
 *   .meta({
 *     scope: 'User',
 *     name: 'User',
 *     description: 'A user object',
 *     example: {
 *       name: 'John',
 *       age: 30,
 *     },
 *   })
 *   .traceable();
 * ```
 *
 * @example
 * ```ts
 * // component-003: Error handling example.
 * try {
 *   // This will throw an error because we're trying to create a component with an invalid target
 *   component('Rule', 42);
 * } catch (error) {
 *   if (error instanceof ComponentError) {
 *     // Caught ComponentError: Target is not a function or an object.
 *     // Error key: INVALID_TARGET
 *   }
 * }
 * ```
 *
 * @public
 */
const component = <Tag extends ComponentTag, Meta extends Record<string, Any> = ComponentMeta>(
  tag: Tag,
  target: Any,
) => {
  // Validate target before any processing.
  if (target === null || target === undefined || !['function', 'object'].includes(typeof target)) {
    throw new ComponentError('INVALID_TARGET', 'Target is not a function or an object.');
  }

  // Generate a unique id for the component (Opinionated structure and deterministic).
  const id = ''.concat(tag.toLowerCase(), ':', hash(tag, String(target)));
  const injectable = injectables.includes(tag as ComponentInjectable);
  const nonInjectable = nonInjectables.includes(tag as ComponentNonInjectable);
  const category = typeof target === 'function' ? 'function' : 'object';

  // Initial data for the component.
  const targetData: ComponentData<Tag, Meta> = {
    id,
    parentId: null,
    tag,
    category,
    subType: null,
    traceable: false,
    injectable,
    meta: null,
  };

  //  Register the component.
  registry.add(target, targetData);

  // Apply base prototype for all components.
  Object.assign(target, ComponentBasePrototype(target));

  // Apply specific prototype for non-injectable components.
  if (nonInjectable) {
    Object.assign(target, NonInjectableComponentPrototype(target));
  }

  // Apply specific prototype for injectable components.
  if (injectable) {
    Object.assign(target, InjectableComponentPrototype(target));
  }

  return target as Component<Tag, Meta>;
};

/**
 * Guard to check if an object is a component.
 *
 * @param maybeComponent - The object to check.
 * @param tag - The tag to check the component against.
 * @returns True if the object is a component, false otherwise.
 *
 * @public
 */
const isComponent = (maybeComponent: Any, tag?: ComponentTag) =>
  registry.exists(maybeComponent) && (tag ? registry.get(maybeComponent).tag === tag : true);

export type {
  ComponentMeta,
  ComponentNonInjectable,
  ComponentInjectable,
  ComponentCategory,
  ComponentSubType,
};
export { component, isComponent, ComponentError };
