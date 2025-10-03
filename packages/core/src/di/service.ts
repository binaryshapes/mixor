/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type Component, component, isComponent, Panic } from '../system';
import type { Any } from '../utils';
import type { Port } from './port';

/**
 * Allowed service dependencies.
 * It can contain ports and/or services.
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
type ServiceFactory<
  T,
  D extends ServiceDeps,
> = (deps: { [K in keyof D]: D[K]['Type'] }) => T;

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
 * Service error class.
 *
 * - FactoryNotSet: The service has no factory function.
 *
 * @internal
 */
class ServiceError extends Panic<'Service', 'FactoryNotSet'>('Service') {}

/**
 * Service builder class.
 *
 * @internal
 */
class ServiceBuilder<T, D extends ServiceDeps> {
  /**
   * The dependencies to use by the service.
   * Can be a Ports or other Services.
   *
   * @remarks
   * Can be updated using the {@link use} method.
   */
  public deps: D = {} as D;

  /**
   * The resolutions of the dependencies.
   *
   * @remarks
   * It is set by the {@link resolve} method.
   */
  public resolutions: Record<keyof D, Any> = {} as Record<keyof D, Any>;

  /**
   * The scope of the service.
   */
  public scope: 'global' | 'internal' | 'public' = 'public';

  /**
   * The factory function to create the service.
   *
   * @remarks
   * It is set by the {@link provide} method.
   */
  public factory: ServiceFactory<T, D> | undefined = undefined;

  /**
   * The instance of the service.
   *
   * @remarks
   * It is set by the {@link resolve} method.
   */
  public instance: T | undefined = undefined;

  /**
   * Sets the dependencies to use.
   *
   * @param deps - The dependencies to use.
   * @returns A new service with the updated dependencies.
   */
  public use<DD extends ServiceDeps>(deps: DD) {
    this.deps = deps as unknown as D;
    return this as unknown as Service<T, DD>;
  }

  /**
   * Sets the factory function to create the service.
   *
   * @param factory - The factory function to create the service.
   * @returns A new service with the factory function set.
   */
  public provide<PP>(factory: ServiceFactory<PP, D>): Service<PP, D> {
    this.factory = factory as unknown as ServiceFactory<T, D>;

    // Here is when we create the service component.
    const svc = component('Service', this, { deps: this.deps })
      .addChildren(...Object.values(this.deps));

    return svc as unknown as Service<PP, D>;
  }

  /**
   * Sets the services resolutions and the service instance.
   *
   * @remarks
   * This method is used to set the services resolutions and the service instance.
   * It is used by the container to resolve the service dependencies and set the service instance.
   *
   * @param resolutions - The services resolutions.
   * @returns The service instance.
   */
  public resolve(resolutions: Record<keyof D, Any>): T {
    // Verify if the factory is set.
    if (!this.factory) {
      throw new ServiceError('FactoryNotSet', 'The service has no factory function');
    }

    this.resolutions = { ...this.resolutions, ...resolutions };
    this.instance = this.factory(this.resolutions);
    return this.instance;
  }

  /**
   * Sets the scope of the service to global.
   *
   * @returns The service builder instance.
   */
  public global() {
    this.scope = 'global';
    return this;
  }

  /**
   * Sets the scope of the service to internal.
   *
   * @returns The service builder instance.
   */
  public internal() {
    this.scope = 'internal';
    return this;
  }

  /**
   * Sets the scope of the service to public.
   *
   * @returns The service builder instance.
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
 * @typeParam P - The type of the dependencies (extends ServiceDeps).
 * @returns A new service builder.
 *
 * @public
 */
const service = <T, P extends ServiceDeps = never>() => new ServiceBuilder<T, P>() as Service<T, P>;

/**
 * Guard function to check if the given object is a service.
 *
 * @typeParam T - The type of the service it provides.
 * @typeParam P - The type of the dependencies (extends ServiceDeps).
 * @param maybeService - The object to check.
 * @returns True if the object is a service, false otherwise.
 *
 * @public
 */
const isService = <T, P extends ServiceDeps = never>(
  maybeService: Any,
): maybeService is Service<T, P> => isComponent(maybeService, 'Service');

export { isService, service };
export type { Service };
