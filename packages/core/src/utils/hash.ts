/**
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { createHash } from 'node:crypto';

import { isComponent } from '../system';
import type { Any } from '../utils';

/**
 * Checks if the given object is a class.
 *
 * @param object - The object to check.
 * @returns True if the object is a class, false otherwise.
 *
 * @internal
 */
const isClass = (object: unknown) =>
  typeof object === 'function' && /^class\s/.test(Function.prototype.toString.call(object));

/**
 * Checks if the given object is a function.
 *
 * @param object - The object to check.
 * @returns True if the object is a function, false otherwise.
 *
 * @internal
 */
const isObjectFunction = (object: unknown) =>
  typeof object === 'function' && !/^class\s/.test(Function.prototype.toString.call(object));

/**
 * Replace blanks in the given string.
 *
 * @param str - The string to replace blanks in.
 * @returns The string with the blanks replaced.
 *
 * @internal
 */
const cleanEmpty = (str: string) => (str.replaceAll(',', '').length === 0 ? '' : str);

/**
 * Safe stringify the given object.
 *
 * @param object - The object to stringify.
 * @returns The stringified object.
 *
 * @internal
 */
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
          if (isComponent(value)) {
            return String(value);
          }

          // Nested objects.
          if (typeof value === 'object' && !!value) {
            return cleanEmpty(String(Object.values(value)));
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

/**
 * The result of the hash function.
 *
 * @public
 */
type HashResult = {
  /**
   * The hash of the objects using the sha256 algorithm.
   */
  hash: string;
  /**
   * The keys used to create the hash.
   */
  keys: string[];
};

/**
 * Create a hash using the sha256 algorithm for the given objects.
 *
 * @param objects - The arguments to hash.
 * @returns A {@link HashResult} with the stringified hash and the keys used to create it.
 *
 * @public
 */
function hash(...objects: Any[]): HashResult {
  // Remove duplicates and replace spaces and new lines, slashes and other special characters.
  const keys = Array.from(new Set(objects.map((object) => safeStringify(object))))
    .map((key) =>
      // Clean the key from spaces, quotes, new lines, slashes and other special characters
      cleanEmpty(key.replace(/[\s\n/\\"]/g, '')),
    )
    .filter((key) => key.length > 0);

  const hash = createHash('sha256').update(keys.join('')).digest('hex');
  return { hash, keys };
}

export { hash };
export type { HashResult };
