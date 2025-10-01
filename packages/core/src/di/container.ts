/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type Component, component, Panic } from '../system';
import type { Any, Prettify } from '../utils';
import { type Adapter, isAdapter } from './adapter';
import { isPort, type Port, type PortShape } from './port';
import { isService, type Service } from './service';

/**
 * Global cache for resolved dependencies.
 *
 * @internal
 */
const cache = new Map<Any, Any>();

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
 * @public
 */
type ContainerPorts<I extends ContainerItems> = Prettify<
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
 * @internal
 */
type Container<I extends ContainerItems> = Component<'Container', ContainerBuilder<I>>;

/**
 * Panic error for the container module.
 *
 * - InvalidAdapter: The adapter is not valid.
 * - NoAdapter: No adapter found for the port.
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
   * Adds items (ports or services) to the container.
   *
   * @param items - The items to add to the container.
   * @returns A new container builder with the added items.
   */
  public providers<T extends ContainerItems>(items: T): Container<T> {
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
    this.items = newItems as unknown as I;

    // Adding the items as children.
    (this as unknown as Container<T>).addChildren(...Object.values(newItems));

    return this as unknown as Container<T>;
  }

  /**
   * Binds an adapter to a port.
   *
   * @param port - The port to bind the adapter to.
   * @param adapter - The adapter to bind.
   * @returns The container builder instance.
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
   * Gets a port or service from the container and resolves it.
   *
   * @param item - The port or service instance to get.
   * @returns The resolved port or service instance.
   */
  public get<T extends I[keyof I]>(item: T): T extends Service<infer TT, Any> ? TT : Adapter<T> {
    // Verify if the item is in the container.
    const exists = Object.values(this.items).includes(item);
    if (!exists) {
      throw new ContainerError('InvalidItem', `Item "${item.id}" not found in container`);
    }

    const itemName = Object.keys(this.items).find((key) => this.items[key] === item);

    // Check cache first (reuse).
    if (cache.has(item)) {
      return cache.get(item);
    }

    if (isService(item) && item.scope === 'internal') {
      throw new ContainerError(
        'InternalItem',
        `Item "${itemName}" is internal and cannot be resolved`,
        `Use the ".public()" or ".global()" method to get the public item`,
      );
    }

    if (isService(item)) {
      const resolvedDeps: Record<string, Any> = {};

      // Resolve service dependencies.
      for (const [depName, dep] of Object.entries<Any>(item.deps)) {
        // If the dependency is a port, we need to get the adapter from the bindings.
        if (isPort(dep)) {
          const adapter = this.bindings.get(dep);

          if (!adapter) {
            throw new ContainerError(
              'NoAdapter',
              `No adapter bound for port "${depName}" in service "${itemName}"`,
              `The service is "${item.id}" is bound to an adapter and the port is "${dep.id}"`,
            );
          }
          resolvedDeps[depName] = adapter;
        } // Otherwise, we need to get the service from the container.
        else if (isService(dep)) {
          resolvedDeps[depName] = this.get(dep as Any);
        }
      }

      const svc = item.factory(resolvedDeps);

      // Caching the resolved dependencies.
      cache.set(item, svc);

      return svc;
    }

    // Resolve port.
    const adapter = this.bindings.get(item);
    if (!adapter) {
      throw new ContainerError('NoAdapter', `No adapter bound for port "${itemName}"`);
    }

    // Caching the resolved port.
    cache.set(item, adapter);

    return adapter;
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
 * @typeParam I - The container items type.
 *
 * @returns The new container.
 *
 * @public
 */
const container = <I extends ContainerItems>() =>
  component('Container', new ContainerBuilder()) as Container<I>;

export { cache, container, ContainerError };
export type { Container, ContainerPorts };
