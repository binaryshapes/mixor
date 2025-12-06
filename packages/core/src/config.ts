/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Core configuration manager.
 *
 * @public
 */
abstract class ConfigManager {
  /**
   * Core configuration variables.
   *
   * @internal
   */
  private static vars = {
    /**
     * Whether to enable debug mode.
     */
    NUXO_DEBUG: (Deno.env.get('NUXO_DEBUG') ?? 'true') === 'true',
  };

  /**
   * Gets a configuration value by key.
   *
   * @param key - The key of the configuration value to get.
   * @returns The configuration value.
   */
  public static get<T extends keyof typeof this.vars>(key: T): typeof this.vars[T] {
    return this.vars[key];
  }

  /**
   * Sets a configuration value by key.
   *
   * @param key - The key of the configuration value to set.
   * @param value - The value to set.
   */
  public static set<T extends keyof typeof this.vars>(key: T, value: typeof this.vars[T]): void {
    this.vars[key] = value;
  }
}

export { ConfigManager as config };
