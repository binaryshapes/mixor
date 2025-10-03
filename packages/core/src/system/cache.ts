/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Any } from '../utils';

/**
 * Global cache for resolved dependencies.
 *
 * @remarks
 * The cache is used to store the resolved dependencies for containers, services, adapters or ports.
 * It is not designed to be used outside of the system.
 *
 * @public
 */
const cache = new Map<string, Any>();

export { cache };
