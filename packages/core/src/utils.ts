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
  (target as Any)[util.inspect.custom] = () => util.inspect(fn(), { colors: true });
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
 * Checks if the given object is a primitive.
 *
 * @param object - The object to check.
 * @returns True if the object is a primitive, false otherwise.
 *
 * @public
 */
const isPrimitive = (object: unknown) =>
  typeof object === 'string' ||
  typeof object === 'number' ||
  typeof object === 'boolean' ||
  typeof object === 'undefined' ||
  object === null;

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
  const clean = (str: string) => (str.replaceAll(',', '').length === 0 ? '' : str);

  // Safe stringify the given object.
  function safeStringify(object: Any): string {
    // Transform arrays we iterate over the items and filter the native code.
    if (Array.isArray(object)) {
      return clean(object.map((item) => item.id ?? item.toString() ?? '').join(','));
    }

    // For classes, we need to use the constructor string.
    if (isClass(object) || isObjectFunction(object)) {
      return object.id ?? Function.prototype.toString.call(object);
    }

    if (typeof object === 'object' && !!object) {
      return clean(
        Object.entries(object)
          .map(([key, value]) => {
            // If the value is null or undefined, we return an empty string.
            if (value === null || value === undefined) {
              return '';
            }

            // If the value has some id property, we return the id.
            if (typeof value === 'object' && !!value && 'id' in value) {
              return value.id as string;
            }

            // Recursively stringify the value that is a class or object function.
            if (isClass(value) || isObjectFunction(value)) {
              return safeStringify(value);
            }

            // If the value is an object, we apply the toString method or recursively
            // stringify the value.
            if (typeof value === 'object' && !!value) {
              return clean(
                Object.values(value)
                  .map((item) => item.id ?? item.toString() ?? safeStringify(item)).join(','),
              );
            }

            // For primitives, we return the key and value.
            if (isPrimitive(value)) {
              return `${key}:${value}`;
            }

            // Otherwise we use the string default representation.
            return String(value);
          })
          .filter((str) => str.length > 0)
          .join(','),
      );
    }

    // This fallback is safe for arrays, functions and other primitives.
    return String(object);
  }

  // Remove duplicates and replace spaces and new lines, slashes and other special characters.
  const keys = Array.from(new Set(objects.map((object) => safeStringify(object))))
    .map((key) => clean(key.replace(/[\s\n/\\"]/g, '')))
    .filter((key) => key.length > 0);

  const value = createHash('sha256').update(Object.values(keys).join('')).digest('hex');
  return { value, keys };
}

/**
 * A string tag that strips common indentation from multi-line strings (like dedent).
 * Useful for long strings such as documentation.
 *
 * @param strings - The template literal strings.
 * @param values - The interpolated values.
 * @returns The properly formatted string.
 *
 * @public
 */
function doc(strings: TemplateStringsArray, ...values: unknown[]): string {
  // Interpolate values into the template string.
  let raw = '';
  for (let i = 0; i < strings.length; i++) {
    raw += strings[i];
    if (i < values.length) {
      raw += String(values[i]);
    }
  }

  // Split into lines.
  let lines = raw.split(/\r?\n/);

  // Remove leading and trailing empty lines.
  while (lines.length > 0 && lines[0].trim() === '') lines.shift();
  while (lines.length > 0 && lines[lines.length - 1].trim() === '') lines.pop();

  // Find minimum indentation (tabs or spaces) of all non-empty lines.
  let minIndent: number | null = null;
  for (const line of lines) {
    if (line.trim() === '') continue;
    const match = line.match(/^(\s*)/);
    if (match) {
      const indent = match[1].length;
      if (minIndent === null || indent < minIndent) {
        minIndent = indent;
      }
    }
  }

  // Remove the minimum indentation from each line.
  if (minIndent && minIndent > 0) {
    lines = lines.map((line) => (line.trim() === '' ? '' : line.slice(minIndent)));
  }

  return lines.join('\n');
}

export { doc, hash, isClass, isObjectFunction, isPrimitive, merge, setInspect };
