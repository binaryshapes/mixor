/**
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { createHash } from 'crypto';

import type { Any } from '../utils';

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
 * Safe stringify the given object.
 *
 * @param object - The object to stringify.
 * @returns The stringified object.
 *
 * @public
 */
function safeStringify(object: Any): string {
  if (Array.isArray(object)) {
    return object.map((item) => safeStringify(item)).join(',');
  }

  // For classes, we need to use the constructor string.
  if (isClass(object) || isObjectFunction(object)) {
    return Function.prototype.toString.call(object);
  }

  if (typeof object === 'object' && !!object) {
    return JSON.stringify(
      Object.entries(object as Any)
        .map(([key, value]) =>
          typeof value === 'object' ? safeStringify(value) : `${key}:${String(value)}`,
        )
        .join(''),
    );
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
 * @returns The hash of the arguments.
 *
 * @public
 */
function hash(...objects: Any[]): HashResult {
  const keys = objects.map((object) => safeStringify(object));

  return {
    hash: createHash('sha256').update(keys.join('')).digest('hex'),
    keys,
  };
}

export { hash, isClass, isObjectFunction, safeStringify };
export type { HashResult };
