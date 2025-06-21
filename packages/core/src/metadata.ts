/*
 * This file is part of the Daikit project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * The metadata of an object.
 *
 * @internal
 */
type ObjectMetadata = Record<string, unknown>;

/**
 * The key used to store the metadata of an object.
 *
 * @internal
 */
const ObjectMetadataKey = Symbol('__$meta$__');

/**
 * The key used to store the options of an object metadata.
 *
 * @internal
 */
const ObjectMetadataOptionsKey = Symbol('__$options$__');

/**
 * The options for the metadata.
 *
 * @internal
 */
type SetMetadataOptions = {
  /**
   * Whether the metadata is configurable.
   *
   * @defaultValue "readonly"
   */
  mode: 'overwrite' | 'merge' | 'readonly';
};

/**
 * Set the metadata of an object.
 * The metadata is stored in the object itself.
 * The options are stored in the object itself and only will be used if the metadata does not exist.
 *
 * @typeParam O - The type of the object.
 * @param o - The object to name.
 * @param meta - The metadata of the object.
 * @param options - The options for the metadata.
 * @returns A new object with the name property set.
 *
 * @example
 * ```ts
 * // Merge the metadata.
 * const obj = { name: 'John' };
 * setMetadata(obj, { name: 'Jane' }, { writable: true, mode: 'merge' });
 * getMetadata(obj); // { name: 'Jane' }
 *
 * // Overwrite the metadata.
 * setMetadata(obj, { name: 'Jane' }, { writable: true, mode: 'overwrite' });
 * getMetadata(obj); // { name: 'Jane' }
 * ```
 *
 * @public
 */
function setMetadata<M extends ObjectMetadata, O extends object = object>(
  o: O,
  meta: M,
  options: SetMetadataOptions = { mode: 'readonly' },
): O {
  const metadataExists = ObjectMetadataKey in o && ObjectMetadataOptionsKey in o;

  if (!metadataExists) {
    Object.defineProperty(o, ObjectMetadataOptionsKey, { value: options });

    return Object.defineProperty(o, ObjectMetadataKey, {
      value: meta,
      writable: options.mode !== 'readonly',
      configurable: options.mode !== 'readonly',
    });
  }

  // If the metadata already exists, we need the original metadata writable value.
  const {
    value: originalMetadata,
    writable: originalWritable,
    configurable: originalConfigurable,
  } = Object.getOwnPropertyDescriptor(o, ObjectMetadataKey) as PropertyDescriptor;

  if (!originalWritable) {
    throw Error('Metadata already exists, cannot be overwritten');
  }

  const { mode: originalMode } = o[ObjectMetadataOptionsKey] as SetMetadataOptions;

  return Object.defineProperty(o, ObjectMetadataKey, {
    value: originalMode === 'merge' ? { ...originalMetadata, ...meta } : meta,
    writable: originalWritable,
    configurable: originalConfigurable,
  });
}

/**
 * Helper function to get the metadata of a function.
 *
 * @typeParam O - The type of the object.
 * @param o - The object to get the metadata of.
 * @returns The metadata of the object.
 *
 * @example
 * ```ts
 * const obj = { name: 'John' };
 * setMetadata(obj, { name: 'Jane' });
 * getMetadata(obj); // { name: 'Jane' }
 * ```
 *
 * @public
 */
function getMetadata<M, O extends object = object>(o: O): M {
  if (ObjectMetadataKey in o) {
    return o[ObjectMetadataKey] as M;
  }
  throw Error(`Metadata not found for object: ${o}`);
}

export { setMetadata, getMetadata };
