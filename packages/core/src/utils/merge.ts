/**
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { Any } from './generics';

/**
 * Merges the objects into the target.
 *
 * @param target - The target to merge into.
 * @param objects - The objects to merge into the target.
 * @returns The merged object.
 *
 * @public
 */
const merge = (target: Any, ...objects: Any[]) => {
  // loop through all the rest objects.
  objects.forEach((obj) => {
    // If the object is a function, merge the prototype.
    Object.assign(target, obj);
    Object.setPrototypeOf(target, obj);

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
