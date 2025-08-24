/**
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { createHash } from 'node:crypto';

import type { Any } from './generics';
import { assert } from './logger';
import { panic } from './panic';

/**
 * Type representing the type of registry object.
 *
 * @public
 */
type RegistryTargetType = 'function' | 'object' | 'class';

/**
 * Type representing the sub type of a registry object.
 *
 * @public
 */
type RegistryTargetSubType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'bigint'
  | 'symbol'
  | 'date'
  | 'url'
  | 'array'
  | 'object'
  | 'enum';

/**
 * Type representing the info of a registry object.
 *
 * @public
 */
type RegistryInfo<Tag extends string, Extra extends Record<string, Any> = Record<never, never>> = {
  readonly id: string;
  readonly childrenIds: string[];
  readonly tag: Tag;
  readonly type: RegistryTargetType;
  readonly traceable: boolean;
  readonly subType: RegistryTargetSubType | null;
  readonly meta: Record<string, Any>;
} & Extra;

/**
 * Represents a node in the registry object dependency tree.
 *
 * @typeParam T - The object type.
 *
 * @public
 */
type RegistryTreeNode<T> = {
  /** The object instance. */
  readonly self: T;
  /** Child nodes in the tree. */
  readonly children: RegistryTreeNode<Any>[];
  /** Depth level in the tree (0 for root). */
  readonly depth: number;
  /** Path from root to this node. */
  readonly path: string[];
};

/**
 * Registry module panic error.
 *
 * @public
 */
class RegistryError extends panic<'Registry', 'InvalidTarget' | 'AlreadyRegistered' | 'NotFound'>(
  'Registry',
) {}

/**
 * Registry to manage objects references, metadata and identifiers.
 *
 * @public
 */
class Registry {
  /**
   * Info related to a registered object.
   */
  private static info = new WeakMap<Any, RegistryInfo<string, Record<string, Any>>>();

  /**
   * Catalog of registered objects.
   */
  private static catalog = new Map<string, Any>();

  /**
   * Reference counter of registered objects.
   */
  private static refs = new Map<string, number>();

  /**
   * Hash a set of arguments.
   *
   * @param args - The arguments to hash.
   * @returns The hash of the arguments.
   *
   * @public
   */
  static hash(...args: Any[]): string {
    const safeArgs = args.map((arg) => {
      if (typeof arg === 'object' && !!arg)
        return JSON.stringify(
          Object.entries(arg as Any)
            .map(([key, value]) =>
              typeof value === 'object' ? Registry.hash(value) : `${key}:${String(value)}`,
            )
            .join(''),
        );

      // This fallback is safe for arrays, functions and other primitives.
      return String(arg);
    });

    return createHash('sha256').update(safeArgs.join('')).digest('hex');
  }

  /**
   * Add a target to the registry.
   *
   * @remarks
   * The target is added to the registry with a unique id.
   * The id is a combination of the target tag, the target hash and the reference counter.
   * The target hash is a hash of the object tag, the target and the extra fields provided.
   * The metadata is stored using the generated id.
   *
   * @param target - The target to add.
   * @param tag - The tag of the target.
   * @param type - The type of the target.
   * @param subType - The sub type of the target.
   * @throws A {@link RegistryError} if the target is already registered.
   *
   * @public
   */
  static add<Target, Tag extends string>(
    target: Target,
    tag: Tag,
    type?: RegistryTargetType,
    subType?: RegistryTargetSubType,
  ) {
    // Validate target before any processing.
    if (
      target === null ||
      target === undefined ||
      !['function', 'object'].includes(typeof target)
    ) {
      throw new RegistryError('InvalidTarget', 'Target is not a function or an object.');
    }

    // This is the more deterministic way to create an id in buildtime without depending on
    // the a persistent layer (like a database or a file system to store the generated ids).
    // Add the target the internal hash.
    const targetHash = Registry.hash(target);

    // Initialize or increment the reference counter for the target.
    const ref = Registry.refs.has(targetHash) ? (Registry.refs.get(targetHash) ?? 1) + 1 : 1;
    Registry.refs.set(targetHash, ref);

    // Generate the id for the target.
    const id = `${tag.toLowerCase()}:${targetHash}:${ref}`;

    // This should never happen, so we throw an error.
    if (Registry.info.has(target)) {
      throw new RegistryError(
        'AlreadyRegistered',
        `Target "${targetHash}" already registered.`,
        `Make sure this component is not using an already registered target: "${target}"`,
      );
    }

    // Initialize the object info.
    const info: RegistryInfo<string> = {
      id,
      childrenIds: [],
      tag,
      // By default, all functions are traceable.
      traceable: typeof target === 'function',
      type: type ?? (typeof target === 'function' ? 'function' : 'object'),
      subType: subType ?? null,
      meta: {},
    };

    Registry.catalog.set(id, target);
    Registry.info.set(target, info);
  }

  /**
   * Set the given data into the registry info for the given target.
   *
   * @remarks
   * Be careful when using this method as it can break the object data.
   * All matches will be overridden.
   *
   * @param target - The object to set the data for.
   * @param data - The data to set.
   * @throws A {@link RegistryError} if the object is not found in the registry.
   *
   * @public
   */
  static set<Extra extends Record<string, Any>>(target: Any, data: RegistryInfo<Any, Extra>): void {
    // Merge the data with the new data. All matches will be overridden.
    Registry.info.set(target, { ...Registry.get(target), ...data });
  }

  /**
   * Get the info for the given target.
   *
   * @param target - The object to get the info for.
   * @returns The info for the object.
   *
   * @public
   */
  static get(target: Any): RegistryInfo<Any> {
    return Object.freeze(Registry.info.get(target) as RegistryInfo<Any>);
  }

  /**
   * Check if the given target exists.
   *
   * @param target - The object to check.
   * @returns True if the object exists, false otherwise.
   *
   * @public
   */
  static exists(target: Any): boolean {
    return Registry.info.has(target);
  }

  /**
   * Get the catalog of all registered objects.
   *
   * @returns The catalog of all registered objects.
   *
   * @public
   */
  static get items(): RegistryInfo<Any>[] {
    return Array.from(Registry.catalog.values()).map((item) => this.get(item));
  }

  /**
   * Build a dependency tree for the given target.
   *
   * @param id - The ID of the object to build the tree for.
   * @param depth - Current depth in the tree.
   * @param path - Current path from root.
   * @param visited - Set of visited object IDs to prevent cycles.
   * @returns A tree node representing the target and its dependencies.
   *
   * @public
   */
  static tree(
    id: string,
    depth = 0,
    path: string[] = [],
    visited: Set<string> = new Set(),
  ): RegistryTreeNode<Any> {
    const self = this.catalog.get(id);

    if (!self) {
      throw new RegistryError('NotFound', `Object not found: ${id}`);
    }

    const info = this.get(self);

    // Prevent infinite recursion in case of circular dependencies.
    if (visited.has(id)) {
      return {
        self,
        children: [],
        depth,
        path: [...path, id],
      } satisfies RegistryTreeNode<Any>;
    }

    visited.add(id);
    const currentPath = [...path, id];

    // Build children trees.
    const children = info.childrenIds
      .map((childId: string) => {
        const childTarget = this.catalog.get(childId);

        // This should never happen, but we assert it to be sure.
        assert(childTarget, `Child target not found: ${childId}. Maybe you tree is corrupted.`);

        // Build the child tree.
        return this.tree(childId, depth + 1, currentPath, visited);
      })
      .filter(
        (child: RegistryTreeNode<Any> | null): child is RegistryTreeNode<Any> => child !== null,
      );

    return {
      self,
      children,
      depth,
      path: currentPath,
    };
  }
}

export { Registry, RegistryError };
export type { RegistryInfo, RegistryTargetSubType, RegistryTargetType, RegistryTreeNode };
