/*
 * This file is part of the Mixor project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { Any } from './generics';

/**
 * Known core elements.
 *
 * @internal
 */
type ElementsTags =
  | 'Aggregate'
  | 'Method'
  | 'Event'
  | 'Spec'
  | 'Schema'
  | 'Value'
  | 'Port'
  | 'Adapter'
  | 'Service'
  | 'Container'
  | 'Criteria';

/**
 * Metadata of an element.
 *
 * @typeParam T - The tag of the element.
 *
 * @internal
 */
type ElementMeta<T extends ElementsTags> = {
  readonly _id: string;
  readonly _tag: T;
  readonly _hash: string;
  readonly _doc?: string;
};

/**
 * A element type conserves the original shape of the given type and adds a meta object with
 * the following properties:
 * - _id: Unique id of the element.
 * - _tag: Tag of the element.
 * - _hash: Hash of the element.
 * - _doc: Documentation string of the element.
 *
 * @typeParam T - The tag of the element.
 * @typeParam V - The values of the element.
 *
 * @internal
 */
type Element<T extends ElementsTags, V> = V & {
  readonly '~meta': ElementMeta<T>;
};

/**
 * Options for element creation.
 *
 * @internal
 */
type ElementOptions = {
  /** Unique hash of the element. */
  hash: string;
  /** Tag of the element. */
  tag: ElementsTags;
  /** Documentation string of the element. */
  doc?: string;
};

/**
 * Creates an element with a unique id, tag, hash, and values.
 *
 * @param values - The values of the element.
 * @param options - The options for element creation.
 * @returns The element object with metadata including id, tag, hash, and optional documentation.
 *
 * @example
 * ```ts
 * // element-001: Basic element creation with required metadata.
 * const userData = { name: 'John', age: 30 };
 * const element = element(userData, {
 *   hash: 'user-123',
 *   tag: 'Value',
 *   doc: 'User information element'
 * });
 * // element: userData with metadata attached.
 * ```
 *
 * @example
 * ```ts
 * // element-002: Element creation without documentation.
 * const configData = { port: 8080, host: 'localhost' };
 * const element = element(configData, {
 *   hash: 'config-456',
 *   tag: 'Schema'
 * });
 * // element: configData with metadata attached.
 * ```
 *
 * @public
 */
const element = <T>(values: T, options: ElementOptions) =>
  Object.defineProperty(values, '~meta', {
    value: {
      _id: crypto.randomUUID(),
      _tag: options.tag,
      _hash: options.hash,
      _doc: options.doc,
    },
    writable: false,
    configurable: false,
    enumerable: true,
  }) as T;

/**
 * Gets the metadata of an element.
 *
 * @typeParam T - The tag of the element.
 * @param element - The element to get the metadata of.
 * @returns The metadata object containing id, tag, hash, and optional documentation.
 *
 * @example
 * ```ts
 * // element-003: Retrieving element metadata.
 * const userData = { name: 'John', age: 30 };
 * const element = element(userData, {
 *   hash: 'user-123',
 *   tag: 'Value',
 *   doc: 'User information'
 * });
 * const metadata = getElementMeta(element);
 * // metadata: { _id: string, _tag: 'Value', _hash: 'user-123', _doc: 'User information' }.
 * ```
 *
 * @public
 */
const getElementMeta = <T extends ElementsTags>(
  element: Element<T, Any>,
): ElementMeta<T> | undefined => element['~meta'] as ElementMeta<T>;

/**
 * Checks if an element is of a specific tag.
 *
 * @typeParam T - The tag of the element.
 * @param maybeElement - The maybe element to check.
 * @param tag - The tag to check against.
 * @returns True if the element is of the specified tag, false otherwise.
 *
 * @example
 * ```ts
 * // element-004: Checking if an element is of a specific tag.
 * const userData = { name: 'John', age: 30 };
 * const element = element(userData, {
 *   hash: 'user-123',
 *   tag: 'Value',
 *   doc: 'User information'
 * });
 * const isUserElement = isElement(element, 'Value'); // true.
 * ```
 *
 * @public
 */
const isElement = <T extends ElementsTags>(
  maybeElement: Any,
  tag: T,
): maybeElement is Element<T, Any> =>
  !!maybeElement && '~meta' in maybeElement && maybeElement['~meta']._tag === tag;

export type { Element, ElementsTags };
export { element, getElementMeta, isElement };
