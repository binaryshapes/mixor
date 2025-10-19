/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Any } from './utils';

/**
 * Global registry of all the registries used in the system.
 *
 * @internal
 */
const registry = {
  /**
   * Global state of the system metadata.
   *
   * @public
   */
  systemMeta: new Map<string, Any>(),

  /**
   * Global state of the tracking metadata.
   *
   * @public
   */
  trackingMeta: new Map<string, Any>(),
};

/**
 * Gets a store from the global stores.
 *
 * @typeParam T - The type of the registry.
 * @param name - The name of the registry to get.
 * @returns The typed registry map.
 *
 * @public
 */
const getRegistry = <T>(name: keyof typeof registry): Map<string, T> => registry[name];

export { getRegistry };
