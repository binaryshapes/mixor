/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type Adapter, isAdapter } from './adapter.ts';
import { type Component, component, isComponent } from './component.ts';
import type { Any, FilterEmptyObjects, Pretty, UnionToIntersection } from './generics.ts';
import { logger } from './logger.ts';
import { panic } from './panic.ts';
import { isPort, type Port, type PortShape } from './port.ts';
import { isProvider, type Provider, type ProviderAllowedDependencies } from './provider.ts';
import { doc } from './utils.ts';

/**
 * The tag for the container component.
 *
 * @internal
 */
const CONTAINER_TAG = 'Container' as const;

/**
 * The dependency injection registry.
 *
 * @internal
 */
const di = {
  /**
   * The map of resolved providers.
   */
  providers: new Map<ProviderComponent, Any>(),
  /**
   * The map of resolved containers.
   */
  containers: new Map<ContainerBuilder<Any>, Map<ProviderComponent, Any>>(),
};

// Generics for the container module.
type ProviderComponent = Provider<Any, Any>;
type PortComponent = Port<PortShape>;
type ContainerComponent = Component<typeof CONTAINER_TAG, unknown>;
type AdapterComponent = Adapter<Any, PortShape>;

/**
 * The type of the imports of the container.
 *
 * @internal
 */
type ContainerImports = Record<string, ProviderComponent | ContainerComponent>;

/**
 * Recursively extracts all ports from a provider's dependencies (including nested providers).
 *
 * @typeParam Path - The current path prefix for the concatenated keys (e.g., "UserService").
 * @typeParam I - The imports of the container.
 *
 * @internal
 */
type ExtractPorts<
  Path extends string,
  I extends ProviderAllowedDependencies,
> = [I] extends [never] ? Record<PropertyKey, never>
  : keyof I extends never ? Record<PropertyKey, never>
  : UnionToIntersection<
    {
      [IK in keyof I]: I[IK] extends PortComponent ? {
          [Key in `${Path}.${IK & string}`]: I[IK];
        }
        : I[IK] extends Provider<Any, infer II extends ProviderAllowedDependencies>
          ? ExtractPorts<`${Path}.${IK & string}`, II>
        : never;
    }[keyof I]
  >;

/**
 * Extracts all ports from all providers in the container imports with concatenated keys.
 * Processes nested providers recursively.
 *
 * @typeParam I - The imports of the container.
 *
 * @internal
 */
type ContainerPorts<I extends ContainerImports> = Pretty<
  UnionToIntersection<
    FilterEmptyObjects<
      {
        [K in keyof I]: I[K] extends Provider<Any, infer D> ? ExtractPorts<K & string, D>
          : I[K] extends Container<Any> ? I[K]['Ports']
          : never;
      }[keyof I]
    >
  >
>;

/**
 * Recursively extracts all providers from a container's imports (including nested containers).
 *
 * @typeParam I - The imports of the container.
 *
 * @internal
 */
type ContainerProviders<I extends ContainerImports> = Pretty<
  UnionToIntersection<
    {
      [IK in keyof I]: I[IK] extends ProviderComponent ? {
          [Key in IK & string]: I[IK];
        }
        : I[IK] extends Container<infer II> ? ContainerProviders<II>
        : never;
    }[keyof I]
  >
>;

/**
 * The type of the container.
 *
 * @typeParam I - The imports of the container.
 *
 * @public
 */
type Container<I extends ContainerImports> = Component<
  typeof CONTAINER_TAG,
  ContainerBuilder<I> & { Ports: ContainerPorts<I>; Providers: ContainerProviders<I> }
>;

/**
 * The panic error for the container module.
 *
 * @remarks
 * Possible panic codes:
 * - `CannotImportAfterExport`: The imports cannot be imported after the exports have been defined.
 * - `InvalidImport`: The imports are invalid.
 * - `InvalidPort`: The port is invalid.
 * - `InvalidAdapter`: The adapter is invalid.
 * - `InvalidBinding`: An adapter cannot be bound to a different port.
 * - `ContainerNotBuilt`: A container that is being imported has not been built.
 * - `InvalidProvider`: The provider is invalid when getting it from the container.
 * - `CircularDependency`: A circular dependency was detected when resolving providers.
 * - `AlreadyAnImplementation`: Attempting to wrap an existing implementation.
 *
 * @public
 */
class ContainerPanic extends panic<
  'Container',
  | 'CannotImportAfterExport'
  | 'InvalidImport'
  | 'InvalidPort'
  | 'InvalidAdapter'
  | 'InvalidBinding'
  | 'ContainerNotBuilt'
  | 'InvalidProvider'
  | 'CircularDependency'
  | 'AlreadyAnImplementation'
>('Container') {}

/**
 * The builder class for the container.
 *
 * @typeParam I - The imports of the container.
 *
 * @internal
 */
class ContainerBuilder<I extends ContainerImports> {
  /**
   * Providers and containers imported and used by the container.
   */
  private imports = [] as unknown as I;

  /**
   * Bindings of the container.
   */
  private bindings = new Map<PortComponent, AdapterComponent>();

  /**
   * Sets the imports of the container.
   *
   * @typeParam II - The type of the imports.
   * @param imports - The imports of the container.
   * @returns The container with the imports set.
   */
  public import<II extends ContainerImports>(imports: II) {
    this.imports = imports as unknown as I;
    return this as unknown as Container<II>;
  }

  /**
   * Binds an adapter to a port.
   *
   * @remarks
   * This method binds an adapter to a port. The adapter must be compatible with the port,
   * meaning it must implement all contracts in the port.
   *
   * @typeParam P - The port type from the container's ports.
   * @typeParam PT - The port type to bind.
   * @typeParam AT - The adapter type to bind.
   * @param port - The port to bind the adapter to.
   * @param adapter - The adapter to bind to the port.
   * @returns The container with the binding set.
   * @throws {ContainerPanic} If the port is invalid, if the adapter is invalid, or if the adapter
   * is bound to a different port.
   */
  public bind<
    P extends ContainerPorts<I>[keyof ContainerPorts<I>],
    PT extends P extends Port<infer TP> ? Port<TP> : never,
    AT extends PT extends Port<infer S> ? Adapter<Any, S> : never,
  >(port: PT, adapter: AT) {
    if (!isPort(port)) {
      throw new ContainerPanic(
        'InvalidPort',
        'Cannot bind a non-port',
        'The port must be a valid port',
      );
    }

    if (!isAdapter(adapter)) {
      throw new ContainerPanic(
        'InvalidAdapter',
        'Cannot bind a non-adapter',
        'The adapter must be a valid adapter',
      );
    }

    if (port.id !== adapter.port.id) {
      throw new ContainerPanic(
        'InvalidBinding',
        'Cannot bind an adapter to a different port',
        'The adapter must be bound to the same port',
      );
    }

    this.bindings.set(port, adapter);
    return this as unknown as Container<I>;
  }

  /**
   * Builds the container and adds it to the registry.
   *
   * @remarks
   * Under the hood, this method will resolve the dependencies of the providers and containers
   * and add them to the providers and containers global maps, so they can be used later.
   *
   * @returns The container.
   * @throws {ContainerPanic} If a container that is being imported has not been built.
   */
  public build() {
    const providers = new Map<ProviderComponent, Any>();
    for (const [, item] of Object.entries(this.imports)) {
      if (isProvider(item)) {
        const resolutions = this.resolve(item.deps);
        providers.set(item, item(resolutions));
      } else if (isContainer(item)) {
        const container = di.containers.get(item);
        // If the container is not found, we need raise an error.
        if (!container) {
          throw new ContainerPanic(
            'ContainerNotBuilt',
            'Cannot import a container that has not been built',
            doc`
            The container must be built before it can be imported.
            Maybe you forgot to call the build method?
            The container is: ${item.id}
            `,
          );
        }
      }
    }

    // Adding to the global providers map.
    for (const [key, item] of providers.entries()) {
      di.providers.set(key, item);
    }

    // Here we create a new component with the container builder and the imports.
    const container = component(CONTAINER_TAG, this) as unknown as Container<I>;

    // The registration must be a component wrapper of the container builder.
    di.containers.set(container, providers);

    return container;
  }

  /**
   * Gets an exported provider of the container by name.
   *
   * @typeParam K - The key of the provider in the container.
   * @typeParam P - The provider component type.
   * @param name - The name of the provider.
   * @returns The provider resolved object ready to be used.
   */
  public get<
    K extends keyof ContainerProviders<I>,
    P extends ContainerProviders<I>[K] extends ProviderComponent ? ContainerProviders<I>[K] : never,
  >(name: K): P['Type'];

  /**
   * Gets an exported provider of the container by provider component.
   *
   * @typeParam P - The provider type from the container's providers.
   * @typeParam PT - The provider component type.
   * @param provider - The provider component.
   * @returns The provider resolved object ready to be used.
   */
  public get<
    P extends ContainerProviders<I>[keyof ContainerProviders<I>],
    PT extends P extends Provider<infer TP> ? Provider<TP> : never,
  >(provider: PT): PT['Type'];

  /**
   * Gets an exported provider of the container by name or provider component.
   *
   * @param nameOrProvider - The name of the provider or the provider component.
   * @returns The provider resolved object ready to be used.
   */
  public get(nameOrProvider: string | ProviderComponent) {
    if (isProvider(nameOrProvider)) {
      return this.getByProvider(nameOrProvider);
    } else if (typeof nameOrProvider === 'string') {
      return this.getByName(nameOrProvider as keyof ContainerProviders<I>);
    }
  }

  /**
   * Resolves the dependencies for a given record of dependencies.
   *
   * @remarks
   * This method recursively resolves all dependencies, handling ports (via bindings),
   * providers (with caching and circular dependency detection), and nested dependencies.
   *
   * @param deps - The record of dependencies to resolve.
   * @param resolving - Set of providers currently being resolved (for cycle detection).
   * @returns The resolved dependencies.
   * @throws {ContainerPanic} If a port has no binding, if a circular dependency is detected,
   * or if a provider is invalid.
   */
  private resolve(deps: Record<string, Any>, resolving: Set<ProviderComponent> = new Set()) {
    const resolved = {} as Record<string, Any>;

    for (const [key, item] of Object.entries(deps)) {
      // If the value is a port, we need to get the binding from the _bindings map.
      if (isPort(item)) {
        const binding = this.bindings.get(item);
        if (!binding) {
          throw new ContainerPanic(
            'InvalidBinding',
            'Port has no binding',
            doc`
            The port "${key}" requires a binding but none was provided.
            Did you forget to call bind() for this port?
            `,
          );
        }
        resolved[key] = binding;
      } // If the value is a provider, we need to resolve the dependencies.
      else if (isProvider(item)) {
        // Check for circular dependencies.
        if (resolving.has(item)) {
          throw new ContainerPanic(
            'CircularDependency',
            'Circular dependency detected',
            doc`
            A circular dependency was detected when resolving provider "${key}".
            The provider is already being resolved in the current dependency chain.
            `,
          );
        }

        // If the provider has already been resolved, we use that resolution.
        if (di.providers.has(item)) {
          logger.debug(`Using cached provider: ${key}`);
          resolved[key] = di.providers.get(item);
        } else {
          resolving.add(item);
          try {
            const resolutions = this.resolve(item.deps, resolving);
            const providerValue = item(resolutions);
            di.providers.set(item, providerValue);
            resolved[key] = providerValue;
          } finally {
            resolving.delete(item);
          }
        }
      }
    }

    return resolved;
  }

  /**
   * Gets the providers of the container.
   *
   * @remarks
   * This method extracts all providers from the container's imports, including providers
   * from nested containers.
   *
   * @returns The providers of the container.
   * @throws {ContainerPanic} If an import is not a valid provider or container.
   *
   * @public
   */
  public providers(): ContainerProviders<I> {
    return Object.entries(this.imports)
      .reduce((acc, [key, item]) => {
        if (isProvider(item)) {
          acc[key] = item;
        } else if (isContainer(item)) {
          Object.assign(acc, item.providers());
        } else {
          throw new ContainerPanic(
            'InvalidImport',
            'Cannot import a non-provider or container',
            'The import must be a valid provider or container',
          );
        }
        return acc;
      }, {} as Record<string, unknown>) as unknown as ContainerProviders<I>;
  }

  /**
   * Gets an exported provider of the container by name.
   *
   * @typeParam K - The key of the provider in the container.
   * @typeParam P - The provider component type.
   * @param name - The name of the provider.
   * @returns The provider resolved object ready to be used.
   */
  private getByName<
    K extends keyof ContainerProviders<I>,
    P extends ContainerProviders<I>[K] extends ProviderComponent ? ContainerProviders<I>[K] : never,
  >(name: K) {
    const providers = this.providers();
    return this.get(providers[name] as keyof ContainerProviders<I>) as unknown as P['Type'];
  }

  /**
   * Gets an exported provider of the container by provider component.
   *
   * @typeParam P - The provider component type.
   * @param provider - The provider component.
   * @returns The provider resolved object ready to be used.
   * @throws {ContainerPanic} If the provider is invalid or if the container has not been built.
   */
  private getByProvider<P extends ProviderComponent>(provider: P) {
    if (!isProvider(provider)) {
      throw new ContainerPanic(
        'InvalidProvider',
        'Cannot get a non-provider',
        'The provider must be a valid provider',
      );
    }

    const containerResolutions = di.containers.get(this);

    if (!containerResolutions) {
      throw new ContainerPanic(
        'ContainerNotBuilt',
        'Cannot get a provider from a container that has not been built',
        'The container must be built before it can be used',
      );
    }

    return di.providers.get(provider) as P['Type'];
  }
}

/**
 * Creates a new container builder in order to create a new container.
 *
 * @typeParam I - The imports of the container.
 * @returns A new container builder.
 *
 * @public
 */
const container = <I extends ContainerImports>(): Container<I> =>
  new ContainerBuilder<I>() as Container<I>;

/**
 * Type guard function that determines whether an object is a container.
 *
 * @param maybeContainer - The object to check.
 * @returns True if the object is a container, false otherwise.
 *
 * @internal
 */
const isContainer = (maybeContainer: Any): maybeContainer is Container<Any> =>
  isComponent(maybeContainer, CONTAINER_TAG);

export { container, ContainerPanic, di };
export type { Container };
