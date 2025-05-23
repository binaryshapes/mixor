/*
 * This file is part of the Daikit project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Converts a string to camel case.
 *
 * @param str - The string to convert.
 * @returns The camel case string.
 *
 * @example
 * ```ts
 * toCamelCase('my_string'); // 'myString'
 * ```
 */
function toCamelCase(str: string) {
  return str
    .replace(/[^a-zA-Z0-9_]/g, '')
    .split('_')
    .map((word, index) =>
      index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    )
    .join('');
}

/**
 * Converts a string to Pascal case.
 *
 * @param str - The string to convert.
 * @returns The Pascal case string.
 *
 * @example
 * ```ts
 * toPascalCase('my_string'); // 'MyString'
 * ```
 */
function toPascalCase(str: string) {
  return str
    .replace(/[^a-zA-Z0-9_]/g, '')
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

export { toCamelCase, toPascalCase };
