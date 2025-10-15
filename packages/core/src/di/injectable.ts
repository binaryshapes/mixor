/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type Component, component, Panic } from '../system';
import type { Any } from '../utils';
import { Adapter, isAdapter } from './adapter';
import { isPort, type Port } from './port';

/**
 * Allowed dependencies of the injectable.
 *
 * @remarks
 * It can contain ports and/or injectable classes.
 *
 * @internal
 */
type InjectableDeps = Record<string, Port<Any> | Injectable<Any>>;

/**
 * Panic error for the injectable module.
 *
 * - InvalidAdapter: The adapter is not valid.
 * - InvalidPort: The port is not valid.
 * - IncompatibleAdapter: The adapter is not compatible with the port.
 * - AdapterNotFound: The adapter is not found for the port.
 * - PortNotFound: The port is not found in the dependencies.
 * - InjectableNotFound: The injectable is not found in the dependencies.
 *
 * @public
 */
class InjectablePanic extends Panic<
  'Injectable',
  | 'InvalidAdapter'
  | 'InvalidPort'
  | 'IncompatibleAdapter'
  | 'AdapterNotFound'
  | 'PortNotFound'
  | 'InjectableNotFound'
>(
  'Injectable',
) {}

/**
 * Extracts all ports from the dependencies.
 *
 * @typeParam D - The dependencies type.
 *
 * @internal
 */
type GetPorts<D extends InjectableDeps> = {
  [K in keyof D as D[K] extends Port<infer V> ? K : never]: D[K];
};

/**
 * The injectable prototype.
 *
 * @typeParam D - The dependencies type.
 *
 * @internal
 */
interface InjectablePrototype<D extends InjectableDeps> {
  bind<P extends GetPorts<D>[keyof GetPorts<D>]>(port: P, adapter: Adapter<P>): this;
  get<T extends D[keyof D]>(target: T): Adapter<T> | InstanceType<T>;
}

/**
 * The injectable class.
 *
 * @typeParam D - The dependencies type.
 *
 * @internal
 */
type Injectable<D extends InjectableDeps> = Component<'Injectable', InjectablePrototype<D>>;

/**
 * Creates a new injectable component.
 *
 * @remarks
 * The injectable is a {@link Component} type that provides a list of dependencies and a way to
 * bind ports to adapters and get the dependencies. Also supports other injectable as dependencies.
 * This a base component in order to use the dependency injection system.
 *
 * @typeParam D - The dependencies type.
 * @param deps - The dependencies.
 * @returns The injectable component.
 *
 * @internal
 */
const injectable = <D extends InjectableDeps = never>(deps: D = {} as D) => {
  const cls = class InjectableComponent implements InjectablePrototype<D> {
    public deps: D = {} as D;
    private resolutions: Map<Any, Adapter<Any> | InstanceType<Any>> = new Map();

    /**
     * Constructor of the injectable component.
     */
    public constructor() {
      for (const [key, value] of Object.entries(deps)) {
        if (isPort(value)) {
          // Register the port as a dependency.
          this.deps = { ...this.deps, [key as keyof D]: value };
        } else {
          // If the dependency is an injectable class, we need to instantiate
          // it and store it as a resolution object.
          this.resolutions.set(value, new value());
        }
      }
    }

    /**
     * Validates if the port is in the dependencies.
     *
     * @param port - The port to validate.
     * @returns True if the port is in the dependencies, false otherwise.
     *
     * @internal
     */
    private isValidPort(port: Port<Any>) {
      return Object.values(this.deps).includes(port);
    }

    /**
     * Binds an adapter to a port.
     *
     * @remarks
     * Only ports can be bound to the injectable component.
     *
     * @param port - The port to bind the adapter to.
     * @param adapter - The adapter to bind to the port.
     * @returns The injectable component.
     */
    public bind<P extends GetPorts<D>[keyof GetPorts<D>]>(port: P, adapter: Adapter<P>) {
      if (!isPort(port)) {
        throw new InjectablePanic('InvalidPort', 'The bound target is not a valid port');
      }

      if (!isAdapter(adapter)) {
        throw new InjectablePanic('InvalidAdapter', 'The bound adapter is not a valid adapter');
      }

      // Verify if the port is in the dependencies.
      if (!this.isValidPort(port)) {
        throw new InjectablePanic(
          'PortNotFound',
          `Port "${port.name ?? port.id}" not found in dependencies`,
        );
      }

      // Verify if the adapter is compatible with the port to be bound.
      if (adapter.port.id !== port.id) {
        throw new InjectablePanic(
          'IncompatibleAdapter',
          `Adapter is not compatible with the Port "${port.id}"`,
          `Expected port: ${port.id}, got: ${adapter.port.id}`,
        );
      }

      this.resolutions.set(port, adapter);
      return this;
    }

    /**
     * Gets a dependency from the injectable component.
     *
     * @param target - The target to get (port or injectable dependency).
     * @returns The target instance.
     */
    public get<T extends D[keyof D]>(target: T) {
      let object: Adapter<T> | InstanceType<T>;

      // Case when the target is a port.
      if (isPort(target)) {
        if (!this.isValidPort(target)) {
          throw new InjectablePanic(
            'PortNotFound',
            `Port "${target.name ?? target.id}" not found in dependencies`,
          );
        }

        // Verify if the adapter is bound to the port.
        object = this.resolutions.get(target);
        if (!object) {
          throw new InjectablePanic(
            'AdapterNotFound',
            `Adapter not found for "${target.name ?? target.id}" port`,
            `You need to bind the adapter to the port using the ".bind()" method`,
          );
        }
        // Otherwise, the target is an injectable class and must be instantiated.
      } else {
        object = this.resolutions.get(target);

        if (!object) {
          throw new InjectablePanic(
            'InjectableNotFound',
            `Injectable "${target.name ?? target.id}" not found in dependencies`,
            `You need to add the injectable to the dependencies list in the "injectable()" function`,
          );
        }
      }

      return object as T extends Port<infer P> ? Adapter<Port<P>> : InstanceType<T>;
    }
  };

  // Here we are creating the component with the dependencies as uniqueness.
  return component('Injectable', cls, deps);
};

export { injectable, InjectablePanic };
export type { Injectable };
