/*
 * This file is part of the Mixor project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { createHash, randomUUID } from 'node:crypto';
import { EventEmitter } from 'node:events';

import { config } from './_config';
import type { Any, Prettify } from './generics';
import { assert, warn } from './logger';
import { panic } from './panic';
import { type Result } from './result';

/**
 * Infer the type of a component.
 *
 * @typeParam T - The type to infer.
 * @typeParam Tag - The tag of the component.
 * @returns The type of the component.
 *
 * @internal
 */
type Infer<T, Tag extends string> =
  // If the tag represents a Schema, Value or Rule, infer the type of the function.
  Tag extends 'Schema' | 'Value' | 'Rule'
    ? T extends (...args: [infer F]) => Any
      ? F
      : T
    : // If the tag represents an Object, return the prettified type.
      Tag extends 'Object' | 'Criteria' | 'Event'
      ? Prettify<T>
      : // Otherwise, return the type as is (no inference needed, the type is already known).
        T;

/**
 * List of non-injectable component types.
 *
 * @internal
 */
const nonInjectableList = [
  'Aggregate',
  'Builder',
  'Command',
  'Condition',
  'Event',
  'Flow',
  'Query',
  'Rule',
  'Schema',
  'Specification',
  'Value',
] as const;

/**
 * List of injectable component types.
 *
 * @internal
 */
const injectableList = ['Port', 'Adapter', 'Service', 'Container', 'Object', 'Criteria'] as const;

/**
 * List of tracer events.
 *
 * @internal
 */
const tracerEvents = ['start', 'finish', 'error', 'performance', 'buildtime'] as const;

/**
 * Type representing non-injectable component tags.
 *
 * @internal
 */
type ComponentNonInjectable = (typeof nonInjectableList)[number];

/**
 * Type representing injectable component tags.
 *
 * @internal
 */
type ComponentInjectable = (typeof injectableList)[number];

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
 * Type representing a tracer event.
 *
 * @internal
 */
type TracerEvent = (typeof tracerEvents)[number];

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
 * Type representing the allowed shape of a component.
 *
 * @typeParam T - The type of the component.
 * @typeParam Tag - The component tag type.
 * @returns The allowed shape of the component.
 *
 * @internal
 */
type ComponentType<Tag extends ComponentTag> = Tag extends 'Object' | 'Criteria'
  ? Record<string, Any>
  : Tag extends ComponentNonInjectable
    ? Tag extends 'Event'
      ? (...args: Any) => Any
      : Tag extends 'Flow' | 'Query' | 'Command'
        ? (...args: Any) => Result<Any, Any> | Promise<Result<Any, Any>>
        : (...args: Any) => Result<Any, Any>
    : (...args: Any) => Any;

/**
 * Core data structure for component information.
 *
 * @typeParam Tag - The component tag type.
 * @typeParam Meta - The metadata type for the component.
 *
 * @internal
 */
type ComponentData<Type, Tag extends ComponentTag> = {
  /** Unique identifier for the component. */
  readonly id: string;

  /** Child components identifiers. */
  readonly childrenIds: string[];

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
  readonly meta: Prettify<
    {
      /** Human-readable name of the traced element. */
      readonly name: string;
      /** Description of the element's purpose. */
      readonly description: string;
      /** Scope or context where the element is used. */
      readonly scope: string;
    } & (Tag extends 'Value' | 'Schema' | 'Object' | 'Event'
      ? {
          readonly example: Infer<Type, Tag>;
        }
      : Record<never, never>)
  > | null;
};

/**
 * Represents a node in the component dependency tree.
 *
 * @typeParam T - The component type.
 *
 * @public
 */
type TreeNode<T> = {
  /** The component instance. */
  readonly component: T;
  /** Component information. */
  readonly info: ComponentData<Any, Any>;
  /** Child nodes in the tree. */
  readonly children: TreeNode<Any>[];
  /** Depth level in the tree (0 for root). */
  readonly depth: number;
  /** Path from root to this node. */
  readonly path: string[];
};

/**
 * Main component interface with fluent API methods.
 *
 * @typeParam Tag - The component tag type.
 * @typeParam Meta - The metadata type for the component.
 *
 * @public
 */
type Component<Tag extends ComponentTag, Type> = Type & {
  /**
   * Inferred type of the component.
   */
  Type: Infer<Type, Tag>;

  /**
   * Set/Override the component metadata.
   *
   * @param meta - The metadata to set.
   * @returns The component for method chaining.
   */
  meta: <Self>(this: Self, meta: ComponentData<Type, Tag>['meta']) => Self;

  /**
   * Set the children for the component.
   *
   * @param children - The children components.
   * @returns The component for method chaining.
   */
  addChildren: <Self>(this: Self, ...children: Component<Any, Any>[]) => Self;

  /**
   * Get the info related to the component.
   *
   * @remarks
   * The info is frozen to prevent modifications and extensions.
   *
   * @returns The component data information.
   */
  info: <Self>(this: Self) => ComponentData<Type, Tag>;

  /**
   * Get the dependency tree for this component.
   *
   * @remarks
   * This method traverses the component hierarchy and builds a tree
   * representation showing all parent-child relationships.
   *
   * @returns A tree node representing this component and its dependencies.
   */
  tree: <Self>(this: Self) => TreeNode<Self>;
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
         * Make the component traceable.
         *
         * @returns The component for method chaining.
         */
        traceable: <Self>(this: Self) => Self;

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
const ComponentError = panic<
  'Component',
  'AlreadyRegisteredError' | 'InvalidTargetError' | 'ComponentNotFoundError'
>('Component');

/**
 * Parse arguments array to extract type information for tracing.
 *
 * This function analyzes function arguments to extract type information
 * without exposing sensitive data.
 *
 * @param args - The arguments array to parse.
 * @returns Array of type strings for each argument.
 *
 * @internal
 */
const parseArgs = (args: Any[]): string[] => {
  return args.map((arg) => (typeof arg === 'object' ? 'object' : typeof arg));
};

/**
 * Parse return object to extract type information for tracing.
 *
 * This function analyzes function returns to extract type information
 * without exposing sensitive data.
 *
 * @param obj - The return object to parse.
 * @returns The parsed object with type information.
 *
 * @internal
 */
const parseReturn = (obj: Record<string, Any>): Record<string, string> => {
  return Object.keys(obj).reduce(
    (acc, key) => ({
      ...acc,
      [key]: typeof obj[key] === 'object' ? parseReturn(obj[key] as object) : typeof obj[key],
    }),
    {} as Record<string, Any>,
  );
};

/**
 * Trace a component. Creating a wrapper function that emits trace events.
 *
 * @remarks
 * This trace is only available for function components.
 *
 * @param component - The component to trace.
 * @returns The traced component.
 *
 * @internal
 */
const trace = (component: Component<Any, Any>) => {
  const { id, category } = component.info();

  // This should never happen, but we assert it to be sure.
  assert(category === 'function', `Component "${id}" must be a function to be traceable`);

  // Create a proxy that intercepts function calls and emits trace events
  const tracedComponent = new Proxy(component, {
    apply: (target, thisArg, args) => {
      const input = { type: parseArgs(args), values: args };
      const start = process.hrtime.bigint();
      const traceId = randomUUID();
      const elementId = id;

      tracer.emit('start', { traceId, elementId, start, input });

      const emitPerf = (finish: bigint, output: Any, isAsync: boolean) => {
        tracer.emit('finish', { finish, output });
        tracer.emit('performance', {
          traceId,
          elementId,
          durationMs: Number(finish - start) / 1_000_000,
          start,
          finish,
          input,
          output,
          async: isAsync,
        });
      };

      const emitError = (finish: bigint, error: Error, isAsync: boolean) => {
        tracer.emit('error', {
          traceId,
          elementId,
          error,
          durationMs: Number(finish - start) / 1_000_000,
          start,
          finish,
          input,
          async: isAsync,
        });
      };

      try {
        // Execute the original function
        const result = Reflect.apply(target, thisArg, args) as Record<string, Any>;

        if (result instanceof Promise) {
          return result
            .then((resolvedValue) => {
              emitPerf(
                process.hrtime.bigint(),
                { type: parseReturn(resolvedValue), values: resolvedValue },
                true,
              );
              return resolvedValue;
            })
            .catch((error) => {
              emitError(process.hrtime.bigint(), error, true);
              throw error;
            });
        } else {
          emitPerf(process.hrtime.bigint(), { type: parseReturn(result), values: result }, false);
          return result;
        }
      } catch (error) {
        emitError(process.hrtime.bigint(), error as Error, false);
        throw error;
      }
    },
    get: (target, prop) => {
      // Forward all property access to the original component
      return target[prop as keyof typeof target];
    },
  });

  return tracedComponent;
};

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
          'AlreadyRegisteredError',
          `Component "${data.id}" already registered.`,
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
    set: (component: Component<Any, Any>, newData: Partial<ComponentData<Any, Any>>) => {
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
    get: (component: Component<Any, Any>) =>
      Object.freeze(store.get(component)) as ComponentData<Any, Any>,

    /**
     * Check if a component exists.
     *
     * @param component - The component to check.
     * @returns True if the component exists, false otherwise.
     *
     * @internal
     */
    exists: (component: Component<Any, Any>) => store.has(component),

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
    meta: (meta: ComponentData<Any, Any>['meta']) => (registry.set(self, { meta }), self),
    addChildren: (...children: Component<Any, Any>[]) => (
      registry.set(self, { childrenIds: children.map((c) => registry.get(c).id) }),
      self
    ),
    info: () => registry.get(self),
    tree: () => buildTree(self.info().id),
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
    traceable: () => (registry.set(self, { traceable: true }), trace(self)),
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
 * Hash a set of arguments.
 *
 * @param args - The arguments to hash.
 * @returns The hash of the arguments.
 *
 * @internal
 */
function hash(...args: unknown[]): string {
  const safeArgs = args.map((arg) => {
    if (typeof arg === 'object')
      return JSON.stringify(
        Object.entries(arg as Any)
          .map(([key, value]) =>
            typeof value === 'object' ? hash(value) : `${key}:${String(value)}`,
          )
          .join(''),
      );

    // This fallback is safe for arrays, functions and other primitives.
    return String(arg);
  });

  return createHash('sha256').update(safeArgs.join('')).digest('hex');
}

/**
 * Build a dependency tree for a component.
 *
 * @param componentId - The ID of the component to build the tree for.
 * @param depth - Current depth in the tree.
 * @param path - Current path from root.
 * @param visited - Set of visited component IDs to prevent cycles.
 * @returns A tree node representing the component and its dependencies.
 *
 * @public
 */
function buildTree(
  componentId: string,
  depth = 0,
  path: string[] = [],
  visited: Set<string> = new Set(),
): TreeNode<Any> {
  const component = registry.catalog.get(componentId);

  if (!component) {
    throw new ComponentError('ComponentNotFoundError', `Component not found: ${componentId}`);
  }

  const info = component.info();

  // Prevent infinite recursion in case of circular dependencies.
  if (visited.has(componentId)) {
    warn(`Circular dependency detected: ${componentId}. Maybe you tree is corrupted.`);
    return {
      component,
      info,
      children: [],
      depth,
      path: [...path, componentId],
    };
  }

  visited.add(componentId);
  const currentPath = [...path, componentId];

  // Build children trees.
  const children = info.childrenIds
    .map((childId: string) => {
      const childComponent = registry.catalog.get(childId);

      // This should never happen, but we assert it to be sure.
      assert(childComponent, `Child component not found: ${childId}. Maybe you tree is corrupted.`);

      // Build the child tree.
      return buildTree(childId, depth + 1, currentPath, visited);
    })
    .filter((child: TreeNode<Any> | null): child is TreeNode<Any> => child !== null);

  return {
    component,
    info,
    children,
    depth,
    path: currentPath,
  };
}

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
 * @public
 */
const component = <Tag extends ComponentTag, Target extends ComponentType<Tag>>(
  tag: Tag,
  target: Target,
) => {
  // Validate target before any processing.
  if (target === null || target === undefined || !['function', 'object'].includes(typeof target)) {
    throw new ComponentError('InvalidTargetError', 'Target is not a function or an object.');
  }

  // Generate a unique id for the component (Opinionated structure and deterministic).
  const id = ''.concat(tag.toLowerCase(), ':', hash(tag, target));
  const injectable = injectableList.includes(tag as ComponentInjectable);
  const nonInjectable = nonInjectableList.includes(tag as ComponentNonInjectable);
  const category = typeof target === 'function' ? 'function' : 'object';

  // Initial data for the component.
  const targetData: ComponentData<Target, Tag> = {
    id,
    childrenIds: [],
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

  return target as Component<Tag, Target>;
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

/**
 * Global tracer for emitting and subscribing to trace events.
 *
 * The tracer provides a centralized event system for trace monitoring.
 * It emits four types of events:
 * - `start`: When a traced function begins execution
 * - `end`: When a traced function completes execution
 * - `perf`: Performance metrics with duration and metadata
 * - `error`: When errors occur during tracing (especially for async functions)
 *
 * For async functions, the tracer provides additional context:
 * - `async: true` flag in perf events
 * - Error events with async context.
 * - Proper timing for Promise resolution.
 *
 * @public
 */
const tracer = (() => {
  const tracer = new EventEmitter();
  tracer.setMaxListeners(config.tracerMaxListeners);

  return {
    /**
     * Emit a trace event with data.
     *
     * @param event - The event type to emit.
     * @param data - The data to include with the event.
     */
    emit: (event: TracerEvent, data: Any) => {
      tracer.emit(event, data);
    },

    /**
     * Subscribe to trace events.
     *
     * @param event - The event type to listen for.
     * @param listener - The callback function to execute.
     */
    on: (event: TracerEvent, listener: (...args: Any[]) => void) => {
      tracer.on(event, listener);
    },

    /**
     * Subscribe to trace events once.
     *
     * @param event - The event type to listen for.
     * @param listener - The callback function to execute.
     */
    once: (event: TracerEvent, listener: (...args: Any[]) => void) => {
      tracer.once(event, listener);
    },

    /**
     * Get the stats of the tracer.
     *
     * @returns The stats of the tracer.
     */
    stats: () => ({
      count: tracerEvents.reduce(
        (acc, event) => {
          acc[event] = tracer.listenerCount(event);
          return acc;
        },
        {} as Record<TracerEvent, number>,
      ),
      maxListeners: tracer.getMaxListeners(),
      events: tracerEvents,
    }),

    /**
     * Clear the tracer all listeners.
     */
    clear: () => {
      tracer.removeAllListeners();
    },
  };
})();

/**
 * List of supported components.
 *
 * @remarks
 * This list is could be useful if you want to check the behavior setup of each
 * component supported by the core.
 *
 * @public
 */
const supportedComponents = [
  ...nonInjectableList.map((tag) => {
    return {
      tag,
      injectable: false as const,
    };
  }),
  ...injectableList.map((tag) => {
    return {
      tag,
      injectable: true as const,
    };
  }),
];

export type { Component };
export { component, supportedComponents, tracer, isComponent, ComponentError, buildTree };
