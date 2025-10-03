/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { cache, type Component, component, isComponent, Panic } from '../system';
import type { Any, RemoveNevers } from '../utils';
import { type Adapter, isAdapter } from './adapter';
import { isPort, type Port, type PortShape } from './port';
import { isService, type Service } from './service';

/**
 * Allowed items for the container.
 *
 * @internal
 */
type ContainerItems = Record<string, Port<Any> | Service<Any, Any>>;

/**
 * Extracts all ports from container items.
 * This includes both direct ports and ports from services.
 *
 * @typeParam I - The container items type.
 *
 * @internal
 */
type ContainerPorts<I extends ContainerItems> = RemoveNevers<
  & {
    // Direct ports (not services).
    [K in keyof I as I[K] extends Port<Any> ? K : never]: I[K] extends Port<infer TP>
      ? TP extends PortShape ? Port<TP> : never
      : never;
  }
  & {
    // Ports from services.
    [
      K in keyof I as I[K] extends Service<Any, infer P> ? `${K & string}.${keyof P & string}`
        : never
    ]: I[K] extends Service<Any, infer P> ? P[keyof P]
      : never;
  }
>;

/**
 * Container type.
 *
 * @typeParam I - The container items type.
 *
 * @public
 */
type Container<I extends ContainerItems> = Component<'Container', ContainerBuilder<I>>;

/**
 * Panic error for the container module.
 *
 * - InvalidAdapter: The adapter is not valid or not compatible with the port.
 * - NoAdapter: No adapter found for the port or adapter is not valid.
 * - InvalidItem: The item is not a service or a port.
 * - InternalItem: The item is internal and cannot be resolved.
 *
 * @public
 */
class ContainerError
  extends Panic<'Container', 'InvalidAdapter' | 'NoAdapter' | 'InvalidItem' | 'InternalItem'>(
    'Container',
  ) {}

/**
 * Class used to build a container.
 *
 * @typeParam I - The container items type.
 *
 * @internal
 */
class ContainerBuilder<I extends ContainerItems = never> {
  /**
   * Items of the container.
   */
  public items: I = {} as I;

  /**
   * Adapter bindings for ports.
   */
  public bindings = new Map<Port<Any>, Adapter<Any>>();

  /**
   * Overrides a port with a new adapter.
   *
   * @param port - The port to override.
   * @param adapter - The adapter to use for the port.
   * @returns The container instance.
   */
  public override<
    P extends ContainerPorts<I>[keyof ContainerPorts<I>],
    PT extends P extends Port<infer TP> ? Port<TP> : never,
  >(
    port: PT,
    adapter: Adapter<PT>,
  ): Container<I> {
    this.bindings.set(port, adapter);

    // Get all services that depend directly or indirectly on the port.
    const directDependencies = Object.values(this.items).filter((item) =>
      isService(item) &&
      Object.values(item.resolutions).some((dep) => dep.info?.childrenIds?.includes(port.id))
    );

    // Now get the services that depends directly from the direct dependency
    const dependencies = Object.values(directDependencies).map((svc) =>
      Object.values(this.items).filter((item) =>
        isService(item) && item.info?.childrenIds?.some((id) => id === svc.id)
      )
    ).flat();

    // Delete the dependencies from the cache.
    new Set([...directDependencies, ...dependencies]).forEach((dep) => cache.delete(dep));

    return this as unknown as Container<I>;
  }

  /**
   * Forwards the items from the imported containers.
   *
   * @remarks
   * This method is used to forward the items from the imported containers to the current container.
   * It is useful to import containers and use their items in the current container.
   *
   * @param containers - The containers to forward.
   * @returns A container with the imported items.
   */
  public imports<C extends Container<Any>[]>(...containers: C) {
    // Extract the items type of the imported containers.
    type II = {
      [K in keyof C]: C[K] extends Container<Any> ? C[K]['items'] : never;
    }[number];

    for (const container of containers) {
      // Adding the bindings of the imported containers.
      this.bindings = new Map([...this.bindings, ...container.bindings]);

      // Adding the items of the imported containers.
      this.items = { ...this.items, ...container.items } as unknown as I;
    }

    // Here is when we create the container component.
    if (!isContainer(this)) {
      return component('Container', this)
        // Adding the items as children.
        .addChildren(...Object.values(this.items)) as unknown as Container<II>;
    }

    return this as unknown as Container<II>;
  }

  /**
   * Declares the items (ports or services) that the container will use.
   *
   * @param items - The items that the container will use.
   * @returns A container with the declared items.
   */
  public use<T extends ContainerItems>(items: T): Container<T> {
    const newItems = { ...this.items } as Any;

    for (const [key, item] of Object.entries(items)) {
      if (isPort(item)) {
        newItems[key] = item;
      } else if (isService(item)) {
        // Add the service itself.
        newItems[key] = item;
        // Also add its ports to the items for easier access.
        Object.entries(item.deps).forEach(([portKey, port]) => {
          newItems[`${key}.${portKey}`] = port;
        });
      } else {
        throw new ContainerError('InvalidItem', `The item "${key}" is not a port or a service`);
      }
    }

    // The new items are the ones that will be used to build the container.
    this.items = { ...this.items, ...newItems } as unknown as I;

    // Here is when we create the container component.
    return component('Container', this)
      // Adding the items as children.
      .addChildren(...Object.values(newItems)) as unknown as Container<T>;
  }

  /**
   * Binds an adapter to a port.
   *
   * @param port - The port to bind the adapter to.
   * @param adapter - The adapter to bind.
   * @returns The container instance.
   */
  public bind<
    P extends ContainerPorts<I>[keyof ContainerPorts<I>],
    PT extends P extends Port<infer TP> ? Port<TP> : never,
  >(
    port: PT,
    adapter: Adapter<PT>,
  ): Container<I> {
    // Verify if is an adapter.
    if (!isAdapter(adapter)) {
      throw new ContainerError('NoAdapter', 'The bound adapter is not a valid adapter');
    }

    // Verify if the adapter is compatible with the port to be bound.
    if (adapter.port !== port) {
      throw new ContainerError(
        'InvalidAdapter',
        `Adapter is not compatible with the Port "${port.id}"`,
        `Expected port: ${port.id}, got: ${adapter.port.id}`,
      );
    }

    // Store the binding.
    this.bindings.set(port, adapter);

    // Adding the adapter as a child.
    (this as unknown as Container<I>).addChildren(adapter);

    return this as unknown as Container<I>;
  }

  /**
   * Helper method to resolve a service with proper type narrowing.
   *
   * @param service - The service to resolve.
   * @returns The resolved service component.
   */
  private resolveService(service: Service<Any, Any>) {
    // Just for error messages purposes.
    const itemName = Object.keys(this.items).find((key) => this.items[key] === service);

    // We cannot resolve internal services.
    if (service.scope === 'internal') {
      throw new ContainerError(
        'InternalItem',
        `Item "${itemName}" is internal and cannot be resolved`,
        `Use the ".public()" or ".global()" method to get the public item`,
      );
    }

    const resolvedDeps: Record<string, Any> = {};

    // Resolve service dependencies.
    for (const [depName, dep] of Object.entries<Any>(service.deps)) {
      // If the dependency is a port, we need to get the adapter from the bindings.
      if (isPort(dep)) {
        const adapter = this.bindings.get(dep);

        if (!adapter) {
          throw new ContainerError(
            'NoAdapter',
            `No adapter bound for port "${depName}" in service "${itemName}"`,
            `The service is "${service.id}" is bound to an adapter and the port is "${dep.id}"`,
          );
        }
        resolvedDeps[depName] = adapter;
      } // Otherwise, we need to get the service from the container.
      else if (isService(dep)) {
        resolvedDeps[depName] = this.get(dep as Any);
      }
    }

    // Setting the resolved dependencies.
    const svc = service.resolve(resolvedDeps);

    return component('Service', svc, service);
  }

  private resolvePort(port: Port<Any>) {
    // Just for error messages purposes.
    const itemName = Object.keys(this.items).find((key) => this.items[key] === port);

    // Resolve port.
    const adapter = this.bindings.get(port);

    if (!adapter) {
      throw new ContainerError('NoAdapter', `No adapter bound for port "${itemName}"`);
    }

    return adapter;
  }

  /**
   * Gets a port or service from the container and resolves it.
   *
   * @param item - The port or service to get.
   * @returns The resolved port adapter or service instance.
   */
  public get<T extends I[keyof I]>(item: T): T extends Service<infer TT, Any> ? TT : Adapter<T> {
    // Verify if the item is in the container.
    const exists = Object.values(this.items).includes(item);
    if (!exists) {
      throw new ContainerError('InvalidItem', `Item "${item.id}" not found in container`);
    }

    // Create a key for the cache.
    const key = this + item;

    // Check cache first (reuse).
    if (cache.has(key)) {
      return cache.get(key);
    }

    // Applying the correct resolver and caching the result.
    const itemResolved = isService(item) ? this.resolveService(item as T) : this.resolvePort(item);
    cache.set(key, itemResolved);

    return itemResolved;
  }
}

/**
 * Creates a new container.
 *
 * @remarks
 * A container is a {@link Component} that encapsulates dependencies for a specific purpose.
 * Commonly used to provide a set of services. Under the hood, it handles all the dependencies
 * that the services depend on, such as port adapters, other services, inclusively other containers
 * that implements those services.
 *
 * It also caches the resolved dependencies to avoid resolving the same dependency twice.
 *
 * The resolutions are computed only when the resource is requested, so the resolution process
 * is lazy and the dependencies are resolved only when they are needed.
 *
 * @typeParam I - The container items type (extends ContainerItems).
 * @returns A new container builder.
 *
 * @public
 */
const container = <I extends ContainerItems>() => new ContainerBuilder() as Container<I>;

/**
 * Guard function to check if the object is a container.
 *
 * @param maybeContainer - The object to check.
 * @returns True if the object is a container, false otherwise.
 *
 * @public
 */
const isContainer = (maybeContainer: Any): maybeContainer is Container<Any> =>
  isComponent(maybeContainer, 'Container');

export { container, ContainerError, isContainer };
export type { Container };
