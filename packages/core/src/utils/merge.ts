/**
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { Any } from './generics';

/**
 * Merges the target into the component.
 *
 * @param target - The target to merge.
 * @param objects - The objects to merge.
 * @returns The merged object.
 *
 * @public
 */
const merge = (target: Any, ...objects: Any[]) => {
  // loop through all the rest objects.
  objects.forEach((obj) => {
    // Adding to the target all component properties.
    Object.assign(target, obj);

    // Copying all component prototype properties to the target.
    const proto = Object.getPrototypeOf(obj);
    Object.getOwnPropertyNames(proto).forEach((name) => {
      if (name !== 'constructor') {
        const descriptor = Object.getOwnPropertyDescriptor(proto, name);
        if (descriptor) {
          Object.defineProperty(target, name, descriptor);
        }
      }
    });
  });

  return target;
};

export { merge };
