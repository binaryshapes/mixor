/**
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import util from 'node:util';

import { type Any } from './generics';

/**
 * Custom inspect data for the given target (commonly classes).
 *
 * @param target - The target to set the inspect function for.
 * @param fn - The function to return when the inspect function is called.
 *
 * @public
 */
function setInspect(target: Any, fn: () => Any) {
  // XXX: I i don't know if this is safe and have support for all javascript runtimes.
  // At least it is working in node and deno.
  (target as Any)[util.inspect.custom] = fn;
}

export { setInspect };
