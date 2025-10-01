/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type Component, component, isComponent } from '../system';
import type { Any } from '../utils';
import type { Port } from './port';

/**
 * Allowed service dependencies.
 * It can be either a port or a service.
 *
 * @internal
 */
type ServiceDeps = Record<string, Port<Any> | Service<Any, Any>>;

/**
 * Service factory function.
 *
 * @remarks
 * It takes the dependencies and returns the service instance.
 *
 * @typeParam D - The type of the dependencies.
 *
 * @internal
 */
type ServiceFactory<T, D extends ServiceDeps> = (
  deps: { [K in keyof D]: D[K]['Type'] },
) => T;

/**
 * Service configuration.
 *
 * @typeParam T - The type of the service it provides.
 * @typeParam D - The type of the dependencies.
 *
 * @internal
 */
type ServiceConfig<T, D extends ServiceDeps> = {
  use: D;
  provide: ServiceFactory<T, D>;
};

/**
 * Service component.
 *
 * @typeParam T - The type of the service it provides.
 * @typeParam D - The type of the dependencies.
 *
 * @public
 */
type Service<T, D extends ServiceDeps> = Component<
  'Service',
  ServiceBuilder<T, D>,
  T
>;

/**
 * Service builder class.
 *
 * @internal
 */
class ServiceBuilder<T, P extends ServiceDeps> {
  /**
   * The dependencies to use.
   */
  public deps: P = {} as P;

  /**
   * The scope of the service.
   */
  public scope: 'global' | 'internal' | 'public' = 'public';

  /**
   * The factory function to create the service.
   */
  public factory: ServiceFactory<T, P>;

  /**
   * The constructor for the service builder.
   *
   * @param config - The configuration for the service.
   */
  public constructor(config: ServiceConfig<T, P>) {
    this.deps = config.use;
    this.factory = config.provide;
  }

  /**
   * Sets the scope of the service to global.
   *
   * @returns A new service builder.
   */
  public global() {
    this.scope = 'global';
    return this;
  }

  /**
   * Sets the scope of the service to internal.
   */
  public internal() {
    this.scope = 'internal';
    return this;
  }

  /**
   * Sets the scope of the service to public.
   */
  public public() {
    this.scope = 'public';
    return this;
  }
}

/**
 * Creates a new service.
 *
 * @remarks
 * A service is a {@link Component} that provides a specific functionality, used across different
 * parts of an application. Services are typically encapsulate non-business logic, like
 * logging, metrics, caching, and other infrastructure-related concerns.
 *
 * @typeParam T - The type of the service it provides.
 * @typeParam P - The type of the dependencies.
 * @param config - The configuration for the service.
 * @returns A new service.
 *
 * @public
 */
const service = <T, P extends ServiceDeps>(config: ServiceConfig<T, P>) =>
  component('Service', new ServiceBuilder<T, P>(config))
    // Adding the dependencies as children.
    .addChildren(...Object.values(config.use)) as Service<T, P>;

/**
 * Guard function to check if the given object is a service.
 *
 * @typeParam T - The type of the service it provides.
 * @typeParam P - The type of the dependencies.
 * @param maybeService - The object to check.
 * @returns True if the object is a service, false otherwise.
 *
 * @public
 */
const isService = <T, P extends ServiceDeps>(maybeService: Any): maybeService is Service<T, P> =>
  isComponent(maybeService, 'Service');

export { isService, service };
export type { Service };
