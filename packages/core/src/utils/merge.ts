/**
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { Any } from './generics';

/**
 * Merges all the given instances into the specified target.
 *
 * @remarks
 * For the given target, it will return a proxy which preserves the original target behavior with
 * all properties and methods for the given instances.
 *
 * @param target - The target to merge.
 * @param instances - The instances to merge.
 * @returns The merged target with the instances properties and methods.
 *
 * @public
 */
function merge(target: Any, ...instances: Any[]) {
  const proxy = new Proxy(target, {
    get(target, prop, receiver) {
      if (prop in target) {
        return Reflect.get(target, prop, receiver);
      }

      for (const inst of instances) {
        if (prop in inst) {
          const value = (inst as Any)[prop];
          if (typeof value === 'function') {
            return (...args: Any[]) => {
              const result = value.apply(inst, args);
              // If the result is the instance, return the proxy.
              return result === inst ? proxy : result;
            };
          }
          return value;
        }
      }

      return undefined;
    },
    set(target, prop, value, receiver) {
      if (prop in target) {
        return Reflect.set(target, prop, value, receiver);
      }
      for (const inst of instances) {
        if (prop in inst) {
          (inst as Any)[prop] = value;
          return true;
        }
      }
      return false;
    },
    apply(target, thisArg, argArray) {
      return target.apply(thisArg, argArray);
    },
  });

  return proxy;
}

export { merge };
