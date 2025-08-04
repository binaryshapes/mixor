/*
 * This file is part of the Mixor project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import crypto from 'node:crypto';

/**
 * Creates a hash for deduplication.
 *
 * @param args - The arguments to create the hash from.
 * @returns A hash.
 *
 * @example
 * ```ts
 * // Create a hash from a string.
 * const stringHash = hash('Hello', 'World');
 * ```
 *
 * @example
 * ```ts
 * // Create a hash from multiple arguments.
 * const objectHash = hash({ name: 'John', age: 30 }, 'Hello', 'World');
 * ```
 *
 * @example
 * ```ts
 * // Create a hash a function.
 * const functionHash = hash((age: number) => age >= 18 ? ok(age) : err('INVALID_AGE'));
 * ```
 *
 * @public
 */
function hash(...args: unknown[]): string {
  const safeArgs = args.map((arg) => {
    if (typeof arg === 'string') return arg;
    if (Array.isArray(arg)) return arg.join(',');
    return JSON.stringify(arg);
  });
  return crypto.createHash('sha256').update(safeArgs.join('')).digest('hex');
}

export { hash };
