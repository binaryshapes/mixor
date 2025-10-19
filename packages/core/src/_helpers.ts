/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

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

export { isClass, isObjectFunction };
