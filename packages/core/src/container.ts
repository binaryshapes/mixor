/*
 * This file is part of the Daikit project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import crypto from 'node:crypto';

import type { Any, Prettify } from './generics';
import { Panic } from './panic';

/**
 * The maximum number of containers to keep in the pool.
 * @internal
 */
const CONTAINER_POOL_SIZE = 100;

/**
 * Global registry for shared adapters to reduce memory usage.
 * @internal
 */
const globalAdapterRegistry = new Map<string, Adapter<Any>>();

/**
 * Global container pool for reusing containers with similar configurations.
 * @internal
 */
const containerPool = new Map<string, Container>();

/**
 * Lazy parser for service dependencies to avoid string parsing overhead.
 * @internal
 */
const requiresCache = new Map<string, string[]>();

/**
 * Panic error for the container module.
 * @public
 */
class ContainerError extends Panic<
  'CONTAINER',
  | 'NO_ADAPTER_BOUND'
  | 'MISSING_DEPENDENCY'
  | 'INVALID_DEFINITION_TYPE'
  | 'CANNOT_OVERRIDE_UNBOUND_PORT'
>('CONTAINER') {}

// *********************************************************************************************
// Container types.
// *********************************************************************************************

/**
 * Represents a port in the container.
 * A port is a dependency interface that can be bound to adapters.
 * It is used to inject dependencies into services.
 *
 * @typeParam T - The type of the port.
 *
 * @internal
 */
type Port<T> = {
  readonly _tag: 'Port';
  readonly _type: T;
  readonly _hash: string;
  readonly id: symbol;
};

/**
 * Represents an adapter in the container.
 * An adapter is a function, object or class that implements a port of type T.
 *
 * @typeParam T - The type of the adapter.
 *
 * @internal
 */
type Adapter<T> = {
  readonly _tag: 'Adapter';
  readonly _type: T;
  readonly _hash: string;
  readonly id: symbol;
  readonly factory: () => T;
  readonly portDeps: Port<Any>[];
};

/**
 * Represents a service in the container.
 * A service is a reusable component providing specific functionality, used across different
 * parts of an application.
 *
 * @typeParam T - The type of the service.
 * @typeParam Deps - The type of the dependencies.
 *
 * @internal
 */
type Service<T, Deps> = {
  readonly _tag: 'Service';
  readonly _type: T;
  readonly _hash: string;
  readonly id: symbol;
  readonly factory: (deps: Deps) => T;
  readonly requires: (keyof Deps)[];
  readonly portDeps: Port<Any>[];
};

/**
 * A container is a collection of services, adapters and ports.
 * Commonly used to encapsulate a set of services and their dependencies.
 *
 * @internal
 */
type Container = {
  _tag: 'Container';
  /**
   * Adds a new service to the container.
   * @typeParam T - The type of the service.
   * @typeParam D - The type of the dependencies.
   * @param def - The service to add.
   * @returns A new container.
   */
  add: <T, D>(def: Service<T, D>) => Container;
  /**
   * Gets a service, adapter or port from the container.
   * @typeParam T - The type of the service.
   * @param def - The service to get.
   * @returns The service.
   */
  get: <T>(def: Service<T, Any> | Adapter<T> | Port<T>) => T;
  /**
   * Binds an adapter to a port in the container.
   * @typeParam T - The type of the port.
   * @param port - The port to bind.
   * @param adapter - The adapter to bind.
   * @returns A new container.
   */
  bind: <T>(port: Port<T>, adapter: Adapter<T>) => Container;
  /**
   * Overrides an adapter bound to a port.
   * @typeParam T - The type of the port.
   * @param port - The port to override.
   * @param adapter - The adapter to override.
   * @returns A new container.
   */
  override: <T>(port: Port<T>, adapter: Adapter<T>) => Container;
  /**
   * Clears the instance cache to free memory and force fresh instance creation.
   * This is useful for testing, debugging, or when you need to reset service state.
   * Note: This creates a new container with the same services and bindings but with a fresh cache.
   * @returns A new container with cleared instance cache.
   */
  clearCache: () => Container;
  /**
   * Describes the container.
   * @returns A description of the container.
   */
  describe: () => {
    services: Map<symbol, Service<Any, Any>>;
    bindings: Map<Port<Any>, Adapter<Any>>;
    instances: WeakMap<symbol, Any>;
  };
};

/**
 * Helper to get the type of a port.
 * @typeParam P - The type of the port.
 *
 * @internal
 */
type PortType<P> = P extends Port<infer T> ? T : never;

/**
 * Helper to infer the element type.
 * @typeParam T - A port, adapter or service type.
 *
 * @internal
 */
type ElementType<T> = T extends { _tag: 'Adapter' | 'Port' | 'Service'; _type: Any }
  ? T['_type']
  : never;

/**
 * Helper to map port names to their types.
 * @typeParam T - The type of the object.
 *
 * @internal
 */
type MapPortsToTypes<T> = Prettify<{
  [K in keyof T]: T[K] extends Port<infer U> ? U : never;
}>;

// *********************************************************************************************
// Internal functions.
// *********************************************************************************************

/**
 * Parses the requires of a service.
 * @param factory - The factory function of the service.
 * @returns The requires of the service.
 *
 * @internal
 */
function parseRequires(factory: unknown): string[] {
  const factoryStr = String(factory);

  if (requiresCache.has(factoryStr)) {
    return requiresCache.get(factoryStr) as string[];
  }

  const match = factoryStr.match(/^\s*(?:function\s*\w*\s*)?\(\s*\{([^}]*)\}\s*\)/);
  const requires = match
    ? match[1]
        .split(',')
        .map((s) => s.trim().split(':')[0])
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  requiresCache.set(factoryStr, requires);
  return requires;
}

/**
 * Creates a hash for deduplication.
 * @param args - The arguments to create the hash from.
 * @returns A hash.
 *
 * @internal
 */
function createHash(...args: unknown[]): string {
  const safeArgs = args.map((arg) => {
    if (typeof arg === 'string') return arg;
    if (Array.isArray(arg)) return arg.join(',');
    return JSON.stringify(arg);
  });
  return crypto.createHash('sha256').update(safeArgs.join('')).digest('hex').slice(0, 8);
}

/**
 * Creates a container hash for pooling.
 * @param services - The services that the container provides.
 * @param bindings - The bindings adapters for the container ports.
 * @returns A hash.
 *
 * @internal
 */
function createContainerHash(
  services: Map<symbol, Service<Any, Any>>,
  bindings: Map<Port<Any>, Adapter<Any>>,
): string {
  const serviceHashes = Array.from(services.values())
    .map((s) => s._hash)
    .filter((hash) => hash !== '')
    .sort();
  const bindingHashes = Array.from(bindings.entries())
    .map(([port, adapter]) => `${port._hash}:${adapter._hash}`)
    .filter((hash) => !hash.endsWith(':'))
    .sort();

  return createHash(serviceHashes, bindingHashes);
}

/**
 * Resolves an instance (adapter or service) with caching.
 * @param def - The adapter or service to resolve.
 * @param services - The services map.
 * @param bindings - The bindings map.
 * @param instances - The instances cache.
 * @returns The resolved instance.
 *
 * @internal
 */
function resolveInstance(
  def: Adapter<Any> | Service<Any, Any>,
  services: Map<symbol, Service<Any, Any>>,
  bindings: Map<Port<Any>, Adapter<Any>>,
  instances: WeakMap<symbol, Any>,
): Any {
  // Check cache first.
  if (instances.has(def.id)) {
    return instances.get(def.id);
  }

  // Resolve adapter directly.
  if (def._tag === 'Adapter') {
    const instance = def.factory();
    instances.set(def.id, instance);
    return instance;
  }

  // Resolve service with dependencies.
  if (def._tag === 'Service') {
    const deps = resolveDependencies(def, services, bindings, instances);
    const instance = def.factory(deps);
    instances.set(def.id, instance);
    return instance;
  }

  throw new ContainerError('INVALID_DEFINITION_TYPE', 'Invalid definition type');
}

/**
 * Resolves service dependencies.
 * @param service - The service to resolve dependencies for.
 * @param services - The services map.
 * @param bindings - The bindings map.
 * @param instances - The instances cache.
 * @returns The resolved dependencies.
 *
 * @internal
 */
function resolveDependencies(
  service: Service<Any, Any>,
  services: Map<symbol, Service<Any, Any>>,
  bindings: Map<Port<Any>, Adapter<Any>>,
  instances: WeakMap<symbol, Any>,
): Record<string, Any> {
  const deps: Record<string, Any> = {};

  // Resolve port dependencies.
  service.portDeps.forEach((port, index) => {
    const adapter = bindings.get(port);
    if (!adapter) {
      throw new ContainerError(
        'NO_ADAPTER_BOUND',
        `No adapter bound for port ${port.id.toString()}`,
      );
    }

    const portValue = resolveInstance(adapter, services, bindings, instances);
    if (index < service.requires.length) {
      deps[service.requires[index] as string] = portValue;
    }
  });

  // Resolve other dependencies.
  service.requires.forEach((key) => {
    // Already resolved as port or dependency.
    if (deps[key as string]) {
      return;
    }

    // Find if the dependency is provided by other service.
    const depDef = Array.from(services.values()).find(
      (d) => d !== service && d.requires.includes(key),
    );

    if (!depDef) {
      throw new ContainerError('MISSING_DEPENDENCY', `Missing dependency "${String(key)}"`);
    }

    deps[key as string] = resolveInstance(depDef, services, bindings, instances);
  });

  return deps;
}

// *********************************************************************************************
// Public container functions.
// *********************************************************************************************

/**
 * Creates a new port with the specified shape.
 * @typeParam T - The type of the port.
 * @returns A new port.
 *
 * @public
 */
function port<T = Any>(): Port<T> {
  const id = crypto.randomUUID();
  const hash = createHash(id);

  return {
    _tag: 'Port',
    _type: {} as T,
    _hash: hash,
    id: Symbol(id),
  };
}

/**
 * Creates a new adapter with deduplication support.
 * Under the hood, it uses a global registry to avoid creating new ones.
 *
 * @typeParam T - The port type that the adapter implements.
 * @param factory - The factory function that creates the adapter.
 * @returns A new adapter.
 *
 * @public
 */
function adapter<T extends Port<Any>>(factory: () => PortType<T>): Adapter<PortType<T>> {
  const hash = createHash(factory.toString());

  // Check if we already have a similar adapter.
  const existingAdapter = globalAdapterRegistry.get(hash);

  if (existingAdapter && existingAdapter.factory.toString() === factory.toString()) {
    return existingAdapter as Adapter<PortType<T>>;
  }

  const newAdapter: Adapter<PortType<T>> = {
    _tag: 'Adapter',
    _type: {} as PortType<T>,
    _hash: hash,
    id: Symbol(crypto.randomUUID()),
    factory,
    portDeps: [],
  };

  globalAdapterRegistry.set(hash, newAdapter);
  return newAdapter;
}

/**
 * Creates a new service with lazy parsing and deduplication.
 * @typeParam T - The type of the service.
 * @param ports - The ports that the service requires.
 * @param factory - The factory function that creates the service.
 * @returns A new service.
 *
 * @public
 */
function service<T, P extends Record<string, Port<Any>> = Record<string, never>>(
  ports: P = {} as P,
  factory: (deps: MapPortsToTypes<P>) => T,
): Service<T, MapPortsToTypes<P>> {
  const hash = createHash(factory.toString(), Object.keys(ports).sort());

  return {
    _tag: 'Service',
    _type: {} as T,
    _hash: hash,
    id: Symbol(crypto.randomUUID()),
    factory,
    requires: parseRequires(factory) as (keyof MapPortsToTypes<P>)[],
    portDeps: Object.values(ports),
  };
}

/**
 * Creates a new container.
 * Under the hood, it uses a pool of containers to avoid creating new ones.
 * Also, it uses a cache to avoid parsing the requires of a service.
 *
 * @param services - The services that the container provides.
 * @param bindings - The bindings adapters for the container ports.
 * @param instances - The instances that the container has.
 * @param bypassPool - Whether to bypass the pool logic.
 * @returns A new container.
 *
 * @public
 */
function container(
  services = new Map<symbol, Service<Any, Any>>(),
  bindings = new Map<Port<Any>, Adapter<Any>>(),
  instances = new WeakMap<symbol, Any>(),
  bypassPool = false,
): Container {
  const containerHash = createContainerHash(services, bindings);

  // Check container pool for reuse, unless bypassPool is true.
  if (!bypassPool && containerPool.has(containerHash)) {
    return containerPool.get(containerHash) as Container;
  }

  // Helper function to create a new container with updated state.
  const createContainer = (
    newServices = services,
    newBindings = bindings,
    newInstances = new WeakMap<symbol, Any>(),
    bypass = false,
  ) => container(newServices, newBindings, newInstances, bypass);

  const newContainer: Container = {
    _tag: 'Container',
    add(def) {
      const newServices = new Map(services);
      newServices.set(def.id, def);
      return createContainer(newServices);
    },

    bind(port, adapter) {
      const newBindings = new Map(bindings);
      newBindings.set(port, adapter);
      return createContainer(undefined, newBindings);
    },

    override(port, adapter) {
      if (!bindings.has(port)) {
        throw new ContainerError('CANNOT_OVERRIDE_UNBOUND_PORT', 'Cannot override unbound port');
      }
      return this.bind(port, adapter);
    },

    get(def) {
      if (def._tag === 'Port') {
        const adapter = bindings.get(def);
        if (!adapter) {
          throw new ContainerError(
            'NO_ADAPTER_BOUND',
            `No adapter bound for port ${def.id.toString()}`,
          );
        }
        return resolveInstance(adapter, services, bindings, instances);
      }
      return resolveInstance(def, services, bindings, instances);
    },

    clearCache() {
      // Bypass the pool to ensure a fresh instance cache
      return container(services, bindings, new WeakMap<symbol, Any>(), true);
    },

    describe: () => ({ services, bindings, instances }),
  };

  // Cache the container for reuse.
  if (!bypassPool) {
    containerPool.set(containerHash, newContainer);

    // Limit pool size to prevent memory leaks.
    if (containerPool.size > CONTAINER_POOL_SIZE) {
      const firstKey = containerPool.keys().next().value;
      if (firstKey) {
        containerPool.delete(firstKey);
      }
    }
  }

  return newContainer;
}

// *********************************************************************************************
// Global registry.
// *********************************************************************************************

/**
 * Global registry for the container module.
 *
 * @public
 */
const registry = {
  /**
   * Clears all global registry to free memory.
   * Only recommended to use in tests.
   *
   * @public
   */
  clear() {
    globalAdapterRegistry.clear();
    containerPool.clear();
    requiresCache.clear();
  },

  /**
   * Gets the global registry.
   * @returns The global registry.
   *
   * @public
   */
  get() {
    return {
      globalAdapterRegistry,
      containerPool,
      requiresCache,
    };
  },
};

export type { Container, Service, Adapter, Port, ElementType };
export { container, service, adapter, port, registry, ContainerError };
