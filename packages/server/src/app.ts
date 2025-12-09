/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Controller } from '@nuxo/components';
import type { n } from '@nuxo/core';

/**
 * The application adapter interface.
 *
 * @remarks
 * An adapter provides the implementation-specific logic for registering controllers
 * and initializing the application server. Different adapters can be used to support
 * different server frameworks or protocols (e.g., HTTP, WebSocket, gRPC).
 * The adapter is responsible for wiring up the controllers to the underlying server
 * infrastructure and starting the server with the specified configuration.
 *
 * @public
 */
interface AppAdapter {
  /**
   * Registers a controller with the adapter.
   *
   * @remarks
   * This method is called for each controller that should be registered with the
   * application. The adapter is responsible for integrating the controller into
   * the server's routing or handler system.
   *
   * @param controller - The controller to register.
   */
  registerController: (controller: Controller<n.Any, n.Any, n.Any>) => void;
  /**
   * Initializes and starts the application server.
   *
   * @remarks
   * This method is called once after all controllers have been registered.
   * It should start the server listening on the specified port and host.
   * The name and version are provided for logging or metadata purposes.
   *
   * @param port - The port number to listen on.
   * @param host - The host address to bind to.
   * @param name - The application name.
   * @param version - The application version.
   */
  init: (port: number, host: string, name: string, version: string) => void;
}

/**
 * The configuration of the application.
 *
 * @remarks
 * The application configuration defines all the settings needed to initialize
 * and run the application. It includes the application metadata (name and version),
 * network settings (port and host), and the adapter implementation that handles
 * the server-specific logic.
 *
 * @public
 */
type AppConfig = {
  /** The application name. Used for logging and identification purposes. */
  name: string;
  /** The application version. Used for logging and identification purposes. */
  version: string;
  /** The port number the server should listen on. */
  port: number;
  /** The host address the server should bind to. */
  host: string;
  /** The adapter implementation that handles server-specific operations. */
  adapter: AppAdapter;
};

/**
 * The default configuration values for the application.
 *
 * @remarks
 * These defaults are used when creating a new application instance or when
 * partial configuration is provided. The adapter must be explicitly set as
 * it cannot have a meaningful default value.
 *
 * @internal
 */
const DEFAULT_CONFIG: AppConfig = {
  name: 'Nuxo',
  version: '0.0.1',
  port: 3000,
  host: '127.0.0.1',
  adapter: undefined as unknown as AppAdapter,
};

/**
 * The application class that manages the application lifecycle.
 *
 * @remarks
 * The App class provides a fluent API for configuring and starting an application.
 * It manages the application configuration, controller registration, and server
 * initialization. Use the builder methods to configure the application, then call
 * {@link App.start} to register all controllers and start the server.
 *
 * The application follows a builder pattern, allowing method chaining for
 * configuration. Controllers are registered with the adapter when {@link App.start}
 * is called, and the adapter is responsible for initializing the server.
 *
 * @public
 */
class App {
  /** The application configuration. */
  #config: AppConfig = DEFAULT_CONFIG;
  /** The list of controllers to register with the application. */
  #controllers: Controller<n.Any, n.Any, n.Any>[] = [];

  /**
   * Configures the application settings.
   *
   * @remarks
   * This method allows you to set or override any configuration values. Partial
   * configuration is supported, meaning you only need to provide the settings
   * you want to change from the defaults. The provided configuration is merged
   * with the default configuration.
   *
   * @param config - The partial configuration object containing the settings to update.
   * @returns The application instance for method chaining.
   */
  config(config: Partial<AppConfig>) {
    this.#config = { ...DEFAULT_CONFIG, ...config };
    return this;
  }

  /**
   * Sets the controllers to be registered with the application.
   *
   * @remarks
   * Controllers define the endpoints or handlers that the application will expose.
   * All provided controllers will be registered with the adapter when {@link App.start}
   * is called. The controllers are registered in the order they appear in the array.
   *
   * @param controllers - An array of controllers to register with the application.
   * @returns The application instance for method chaining.
   */
  public controllers(controllers: Controller<n.Any, n.Any, n.Any>[]) {
    this.#controllers = controllers;
    return this;
  }

  /**
   * Starts the application by registering controllers and initializing the server.
   *
   * @remarks
   * This method performs the final initialization steps:
   * 1. Registers all configured controllers with the adapter.
   * 2. Initializes the server using the adapter's init method with the configured
   *    port, host, name, and version.
   *
   * After calling this method, the server should be running and ready to handle
   * requests. The adapter is responsible for the actual server startup logic.
   */
  public start() {
    this.#controllers.forEach((c) => this.#config.adapter.registerController(c));
    this.#config.adapter.init(
      this.#config.port,
      this.#config.host,
      this.#config.name,
      this.#config.version,
    );
  }
}

/**
 * Creates a new application instance.
 *
 * @remarks
 * This factory function creates a new App instance that can be configured using
 * the fluent builder API. Use the returned instance to configure the application
 * settings, register controllers, and start the server.
 *
 * @returns The application instance ready to be configured and started.
 *
 * @public
 */
const app = () => new App();

export { app };
export type { AppAdapter };
