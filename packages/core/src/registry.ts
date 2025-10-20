/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Any } from './_generics.ts';

/**
 * Global registry of all the registries used in the system.
 *
 * @internal
 */
const registry = {
  /**
   * Global catalog of all the components.
   */
  catalog: new Map<string, Any>(),

  /**
   * Global state for all components instances metadata.
   */
  meta: new Map<string, Any>(),
};

/**
 * Gets a registry from the global registries.
 *
 * @typeParam T - The type of the registry.
 * @param name - The name of the registry to get.
 * @returns The typed registry.
 *
 * @public
 */
const getRegistry = <T>(name: keyof typeof registry): Map<string, T> => registry[name];

export { getRegistry };
