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

const NonInjectableComponent = [
  'Value',
  'Rule',
  'Event',
  'Specification',
  'Aggregate',
  'Schema',
  'Command',
  'Query',
] as const;

const InjectableComponent = ['Port', 'Adapter', 'Service', 'Container'] as const;

type NonInjectableComponentType = (typeof NonInjectableComponent)[number];
type InjectableComponentType = (typeof InjectableComponent)[number];

type ComponentTag = NonInjectableComponentType | InjectableComponentType;

type ComponentCategory = 'function' | 'object';

type ComponentSubType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'bigint'
  | 'symbol'
  | 'date'
  | 'url'
  | 'array';

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

type Component<Tag extends ComponentTag, Meta extends Record<string, Any> = ComponentMeta> = {
  /**
   * Set/Override the component metadata.
   *
   * @param meta - The metadata to set.
   * @returns The component.
   */
  meta: <Self>(this: Self, meta: ComponentMeta<Meta>) => Self;
  /**
   * Set the parent for the component.
   *
   * @param parent - The parent component.
   * @returns The component.
   */
  parent: <Self>(this: Self, parent: Component<Any>) => Self;
  // Exclusive props for injectable components.
  /**
   * Make the component traceable.
   *
   * @returns The component.
   */
  traceable: <Self>(this: Self) => Self;

  /**
   * Get the info related to the component.
   *
   * @remarks
   * The info is frozen to prevent modifications and extensions.
   *
   * @returns The info related to the component.
   */
  info: <Self>(this: Self) => ComponentData<Tag, Meta>;
} & (Tag extends InjectableComponentType
  ? {
      injectable: <Self>(this: Self) => Self;
    }
  : {
      /**
       * Overrides the type of the component.
       *
       * @param type - The type to set.
       * @returns The component.
       */
      subType: <Self>(this: Self, type: ComponentSubType) => Self;
    });

const ComponentError = Panic<
  'COMPONENT',
  // When a component is not found in the registry.
  | 'NOT_FOUND'
  // When a component is already registered.
  | 'ALREADY_REGISTERED'
  // When the target is not a function or an object.
  | 'INCOMPATIBLE_CATEGORY'
>('COMPONENT');

/**
 * Metadata store for components.
 *
 * @internal
 */
const registry = (() => {
  const store = new WeakMap<object, ComponentData<Any, Any> | object>();
  const catalog = new Map<string, Component<Any, Any>>();

  return {
    /**
     * Add a component to the registry.
     *
     * @param component - The component to add.
     * @param data - The data for the component.
     * @throws A {@link ComponentError} if the component is already registered.
     *
     * @internal
     */
    add: (component: Any, data?: ComponentData<Any, Any>) => {
      const cmp = store.get(component);

      if (cmp) {
        throw new ComponentError('ALREADY_REGISTERED', 'Component already registered.');
      }

      catalog.set(component.id, component);
      store.set(component, data || {});
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
     *
     * @internal
     */
    set: (component: Component<Any>, newData: Partial<ComponentData<Any, Any>>) => {
      const data = store.get(component);

      // First time the element is set.
      if (!data) {
        throw new ComponentError(
          'NOT_FOUND',
          'Cannot set data for a component that is not registered.',
        );
      }

      // Merge the data with the new data. All matches will be overridden.
      store.set(component, { ...data, ...newData });
    },

    /**
     * Get the data for a component.
     *
     * @param component - The component to get the data for.
     * @returns The data for the component.
     * @throws A {@link ComponentError} if the component is not registered.
     *
     * @internal
     */
    get: (component: Component<Any>) => {
      const data = store.get(component);

      if (!data) {
        throw new ComponentError(
          'NOT_FOUND',
          'Cannot get data for a component that is not registered.',
        );
      }

      return Object.freeze(data) as ComponentData<Any, Any>;
    },

    /**
     * Check if a component exists.
     *
     * @param maybeComponent - The component.
     * @returns True if the component exists, false otherwise.
     */
    exists: (maybeComponent: Any) => store.has(maybeComponent),

    /**
     * Get the catalog of components.
     *
     * @returns The catalog of components.
     */
    catalog,
  };
})();

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

const NonInjectableComponentPrototype = (self: Any) => {
  return {
    subType: (type: ComponentSubType) => (registry.set(self, { subType: type }), self),
  };
};

const InjectableComponentPrototype = (self: Any) => {
  return {
    injectable: () => (registry.set(self, { injectable: true }), self),
  };
};

const component = <Tag extends ComponentTag, Meta extends Record<string, Any> = ComponentMeta>(
  tag: Tag,
  target: Any,
) => {
  // Generate a unique id for the component (Opinionated structure).
  const id = ''.concat(tag.toLowerCase(), ':', hash(tag, String(target)));
  const injectable = InjectableComponent.includes(tag as InjectableComponentType);
  const nonInjectable = NonInjectableComponent.includes(tag as NonInjectableComponentType);

  // Inferring the category from the target.
  if (!['function', 'object'].includes(typeof target)) {
    throw new ComponentError('INCOMPATIBLE_CATEGORY', 'Target is not a function or an object.');
  }

  const category = typeof target === 'function' ? 'function' : 'object';

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

export type { ComponentMeta };
export { component };
