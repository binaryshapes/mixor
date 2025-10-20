/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { createHash } from 'node:crypto';
import util from 'node:util';

import type { Any } from './generics.ts';

/**
 * Custom inspect data for the given target (commonly classes).
 *
 * @param target - The target to set the inspect function for.
 * @param fn - The function to return when the inspect function is called.
 *
 * @public
 */
function setInspect(target: Any, fn: () => Any) {
  // XXX: I don't know if this is safe and it has support for all JavaScript runtimes.
  (target as Any)[util.inspect.custom] = fn;
}

/**
 * Checks if the given object is a class.
 *
 * @param object - The object to check.
 * @returns True if the object is a class, false otherwise.
 *
 * @public
 */
const isClass = (object: unknown) =>
  typeof object === 'function' && /^class\s/.test(Function.prototype.toString.call(object));

/**
 * Checks if the given object is a function.
 *
 * @param object - The object to check.
 * @returns True if the object is a function, false otherwise.
 *
 * @public
 */
const isObjectFunction = (object: unknown) =>
  typeof object === 'function' && !/^class\s/.test(Function.prototype.toString.call(object));

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

/**
 * The result of the hash function.
 *
 * @public
 */
type HashResult = {
  /**
   * The hash value.
   */
  value: string;
  /**
   * The keys used to create the hash value.
   */
  keys: string[];
};

/**
 * Create a hash using the sha256 algorithm for the given objects.
 *
 * @param objects - The arguments to hash.
 * @returns A {@link HashResult} with the stringified hash value and the keys used to create it.
 *
 * @public
 */
function hash(...objects: Any[]): HashResult {
  // Replace blanks in the given string.
  const cleanEmpty = (str: string) => (str.replaceAll(',', '').length === 0 ? '' : str);

  // Safe stringify the given object.
  function safeStringify(object: Any): string {
    // Transform arrays we iterate over the items and filter the native code.
    if (Array.isArray(object)) {
      return object.map((item) => safeStringify(item)).join(',');
    }

    // For classes, we need to use the constructor string.
    if (isClass(object) || isObjectFunction(object)) {
      return Function.prototype.toString.call(object);
    }

    if (typeof object === 'object' && !!object) {
      const str = JSON.stringify(
        Object.entries(object as Any)
          .map(([, value]) => {
            // Sometimes the value is a component, so we need to stringify directly.
            if (isClass(value)) {
              return String(value);
            }

            // Nested objects.
            if (typeof value === 'object' && !!value) {
              return cleanEmpty(String(Object.values(value)));
            }

            // If the value is null or undefined, we return an empty string.
            if (value === null || value === undefined) {
              return '';
            }

            // Otherwise we use the string representation.
            return String(value);
          })
          .filter((str) => str.length > 0)
          .join(','),
      );

      return str;
    }

    // This fallback is safe for arrays, functions and other primitives.
    return String(object);
  }

  // Remove duplicates and replace spaces and new lines, slashes and other special characters.
  const keys = Array.from(new Set(objects.map((object) => safeStringify(object))))
    .map((key) =>
      // Clean the key from spaces, quotes, new lines, slashes and other special characters
      cleanEmpty(key.replace(/[\s\n/\\"]/g, ''))
    )
    .filter((key) => key.length > 0);

  const value = createHash('sha256').update(keys.join('')).digest('hex');
  return { value, keys };
}

export { hash, isClass, isObjectFunction, merge, setInspect };
