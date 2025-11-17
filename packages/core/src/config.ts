/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Core configuration variables.
 *
 * @internal
 */
const vars = {
  /**
   * The filename for the exported registry.
   */
  REGISTRY_FILENAME: 'nuxo-registry.json',

  /**
   * Whether to enable debug mode.
   */
  NUXO_DEBUG: true,
};

/**
 * Core configuration manager.
 *
 * @public
 */
const config = {
  /**
   * Gets a configuration value by key.
   *
   * @param key - The key of the configuration value to get.
   * @returns The configuration value.
   */
  get: <T extends keyof typeof vars>(key: T) => vars[key],

  /**
   * Sets a configuration value by key.
   *
   * @param key - The key of the configuration value to set.
   * @param value - The value to set.
   */
  set: <T extends keyof typeof vars>(key: T, value: typeof vars[T]): void => {
    vars[key] = value;
  },
};

export { config };
