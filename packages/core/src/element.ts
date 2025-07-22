/*
 * This file is part of the Mixor project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Known core elements.
 *
 * @internal
 */
type Elements =
  | 'Aggregate'
  | 'Method'
  | 'Event'
  | 'Spec'
  | 'Schema'
  | 'Value'
  | 'Port'
  | 'Adapter'
  | 'Service'
  | 'Container';

/**
 * Options for element creation.
 *
 * @internal
 */
type ElementOptions = {
  /** Unique hash of the element. */
  hash: string;
  /** Tag of the element. */
  tag: Elements;
  /** Documentation string of the element. */
  doc?: string;
};

/**
 * Creates an element with a id, tag, hash, and values.
 *
 * @param values - The values of the element.
 * @param options - The options of the element {@link ElementOptions}.
 * @returns The element object with the respective tag, hash and id.
 *
 * @public
 */
function element<T>(values: T, options: ElementOptions) {
  return Object.defineProperty(values, Symbol.for(options.tag), {
    value: {
      _id: crypto.randomUUID(),
      _tag: options.tag,
      _hash: options.hash,
      _doc: options.doc,
    },
    writable: false,
    configurable: false,
    enumerable: false,
  }) as T;
}

export { element };
