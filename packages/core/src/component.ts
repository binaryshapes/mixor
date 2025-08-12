/**
 * Copyright (c) 2025, Binary Shapes. All rights reserved.
 * Licensed under the MIT License.
 *
 * Component module.
 *
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
import { createHash, randomUUID } from 'node:crypto';
import { EventEmitter } from 'node:events';

import { config } from './_config';
import type { Any, Prettify, TypeError } from './generics';
import { Panic } from './panic';
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
      Tag extends 'Object'
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
  'Criteria',
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
const injectableList = ['Port', 'Adapter', 'Service', 'Container', 'Object'] as const;

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
type ComponentType<Tag extends ComponentTag> = Tag extends 'Object'
  ? Record<string, Any>
  : Tag extends ComponentNonInjectable
    ? (...args: Any) => Result<Any, Any>
    : TypeError<'Invalid Component Type'>;

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
  readonly meta: Prettify<
    {
      /** Human-readable name of the traced element. */
      readonly name: string;
      /** Description of the element's purpose. */
      readonly description: string;
      /** Scope or context where the element is used. */
      readonly scope: string;
    } & (Tag extends 'Value' | 'Rule' | 'Schema' | 'Object'
      ? Infer<Type, Tag> extends never
        ? Type
        : {
            readonly example: Infer<Type, Tag>;
          }
      : Record<never, never>)
  > | null;
};

/**
 * Main component interface with fluent API methods.
 *
 * @typeParam Tag - The component tag type.
 * @typeParam Meta - The metadata type for the component.
 *
 * @public
 */
type Component<Type, Tag extends ComponentTag> = Type & {
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
   * Set the parent for the component.
   *
   * @param parent - The parent component.
   * @returns The component for method chaining.
   */
  parent: <Self>(this: Self, parent: Component<Any, Any>) => Self;

  /**
   * Get the info related to the component.
   *
   * @remarks
   * The info is frozen to prevent modifications and extensions.
   *
   * @returns The component data information.
   */
  info: <Self>(this: Self) => ComponentData<Type, Tag>;
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
const ComponentError = Panic<
  'COMPONENT',
  // When a component is already registered.
  | 'ALREADY_REGISTERED'
  // When the target is not a function or an object.
  | 'INVALID_TARGET'
  // Raised when a component is not traceable.
  | 'NOT_TRACEABLE'
>('COMPONENT');

/**
 * Parse an object to extract type information for tracing.
 *
 * This function analyzes objects and arrays to extract type information
 * without exposing sensitive data. It returns type information for
 * primitive values and object structures.
 *
 * @param obj - The object to parse.
 * @returns The parsed object with type information.
 *
 * @internal
 */
const parseObject = (obj: Any): Any => {
  if (!!obj && typeof obj === 'object' && !Array.isArray(obj)) {
    return Object.keys(obj).reduce(
      (acc, key) => ({
        ...acc,
        [key]: typeof obj[key] === 'object' ? parseObject(obj[key]) : typeof obj[key],
      }),
      {} as Record<string, string>,
    );
  }

  if (Array.isArray(obj)) {
    return obj.map((arg) => (typeof arg === 'object' ? parseObject(arg) : typeof arg));
  }

  return typeof obj;
};

/**
 * Trace a component. Creating a wrapper function that emits trace events.
 *
 * @param component - The component to trace.
 * @returns The traced component.
 *
 * @internal
 */
const trace = (component: Component<Any, Any>) => {
  const { id, category } = component.info();

  if (category !== 'function') {
    throw new ComponentError('NOT_TRACEABLE', 'Cannot make non-function elements traceable');
  }

  // Create a wrapper function that emits trace events.
  const wrapped = function (...args: Any[]) {
    const input = { type: parseObject(args), values: args };
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

    const emitError = (end: bigint, error: Error, isAsync: boolean) => {
      tracer.emit('error', {
        traceId,
        elementId,
        error,
        durationMs: Number(end - start) / 1_000_000,
        start,
        end,
        input,
        async: isAsync,
      });
    };

    try {
      // Execute the original function.
      const result = (component as Any)(...args);

      if (result instanceof Promise) {
        return result
          .then((resolvedValue) => {
            emitPerf(
              process.hrtime.bigint(),
              { type: parseObject(resolvedValue), values: resolvedValue },
              true,
            );
            return resolvedValue;
          })
          .catch((error) => {
            emitError(process.hrtime.bigint(), error, true);
            throw error;
          });
      } else {
        emitPerf(process.hrtime.bigint(), { type: parseObject(result), values: result }, false);
        return result;
      }
    } catch (error) {
      emitError(process.hrtime.bigint(), error as Error, false);
      throw error;
    }
  };

  // Keep the original name of the function.
  Object.defineProperty(wrapped, 'name', {
    value: (component as Any).name,
    writable: true,
    enumerable: true,
    configurable: true,
  });

  return Object.assign(wrapped, component);
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
    parent: (parent: Component<Any, Any>) => (
      registry.set(self, { parentId: registry.get(parent).id }),
      self
    ),
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
    if (typeof arg === 'string') return arg;
    if (Array.isArray(arg)) return arg.join(',');
    return JSON.stringify(arg);
  });
  return createHash('sha256').update(safeArgs.join('')).digest('hex');
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
    throw new ComponentError('INVALID_TARGET', 'Target is not a function or an object.');
  }

  // Generate a unique id for the component (Opinionated structure and deterministic).
  const id = ''.concat(tag.toLowerCase(), ':', hash(tag, String(target)));
  const injectable = injectableList.includes(tag as ComponentInjectable);
  const nonInjectable = nonInjectableList.includes(tag as ComponentNonInjectable);
  const category = typeof target === 'function' ? 'function' : 'object';

  // Initial data for the component.
  const targetData: ComponentData<Target, Tag> = {
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

  return target as Component<Target, Tag>;
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
  };
})();

export type { Component };
export { component, tracer, isComponent, ComponentError };
