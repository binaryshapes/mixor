/**
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { type Any, hash } from '../utils';
import { Panic } from './panic';

/**
 * Type representing the registrable target.
 *
 * @public
 */
type Registrable = Record<string, Any> | ((...args: Any[]) => Any) | ((...args: Any[]) => Any)[];

/**
 * A Register is a wrapper around a target. It is used to store the target in the registry and
 * to provide metadata about the target for a specific context.
 *
 * @typeParam Target - The target of the register.
 * @typeParam Tag - The tag of the register.
 *
 * @public
 */
type Register<Target extends Registrable, Tag extends string> = Target &
  RegisterBuilder<Target, Tag>;

/**
 * Registry module panic error.
 *
 * - NotFound: The registry item not found in the cache.
 * - NameAlreadySet: The register name is already set.
 * - DescriptionAlreadySet: The register description is already set.
 *
 * @public
 */
class RegistryPanic extends Panic<
  'Registry',
  'NotFound' | 'NameAlreadySet' | 'DescriptionAlreadySet'
>('Registry') {}

/**
 * The register builder is a class that helps to build a register by providing a set of methods to
 * set the values related to a specific register.
 *
 * @typeParam Target - The target of the register.
 * @typeParam Tag - The tag of the register.
 *
 * @internal
 */
class RegisterBuilder<Target extends Registrable, Tag extends string> {
  // Name of the register builder.
  static name = 'Register';

  /**
   * Unique id of the register.
   */
  public registerId: string;

  /**
   * Keys used to generate the unique id of the register.
   */
  public keys: string[];

  /**
   * The tag of the register.
   */
  public tag: Tag;

  /**
   * The name of the register.
   */
  public name: string | null;

  /**
   * The description of the register.
   */
  public description: string | null;

  /**
   * The category of the register. Mostly related to the target type.
   *
   * - function: The register target is a function and is callable and traceable.
   * - object: The register target is an object and is not callable and not traceable.
   */
  public category: 'function' | 'object';

  /**
   * The traceable flag of the register. Mostly related to the target type.
   *
   * - true: The register target is a function and is callable and traceable.
   * - false: The register target is an object.
   */
  public traceable: boolean;

  /**
   * Internal reference count of the register. Used to avoid overlapping and use the cache system.
   */
  public refCount: number;

  /**
   * The target of the register. It is the original target that was registered and will be wrapped
   * by the register class.
   */
  public target: Target;

  public constructor(id: string, keys: string[], tag: Tag, target: Target) {
    this.registerId = id;
    this.keys = keys;
    this.tag = tag;
    this.name = null;
    this.description = null;
    this.category = typeof target === 'function' ? 'function' : 'object';
    this.traceable = typeof target === 'function';
    this.refCount = 0;
    this.target = target;
  }

  /**
   * Set the name of the register.
   *
   * @param name - The name of the register.
   * @returns The register builder.
   */
  public setName(name: string) {
    if (this.name && this.name !== name) {
      throw new RegistryPanic(
        'NameAlreadySet',
        `The register name is already set with: ${this.name}`,
      );
    }
    this.name = name;
    return this;
  }

  /**
   * Set the description of the register.
   *
   * @param description - The description of the register.
   * @returns The register builder.
   */
  public setDescription(description: string) {
    if (this.description && this.description !== description) {
      throw new RegistryPanic(
        'DescriptionAlreadySet',
        `The register description is already set with: ${this.description}`,
      );
    }
    this.description = description;
    return this;
  }
}

/**
 * Registry class for storing and managing registry items.
 *
 * @public
 */
class Registry {
  /**
   * Cache of the registers.
   */
  public static cache = new Map<string, Register<Any, Any>>();

  /**
   * Info of the registers.
   */
  public static info = new Map<string, Record<string, Any>>();

  /**
   * Create a new register.
   *
   * @remarks
   * The registry uses a cache system to reuse items instead of creating new ones.
   *
   * @param target - The target to create the register for.
   * @param tag - The tag of the register.
   * @param uniqueness - The uniqueness attributes to be considered in the hash for the registry.
   * @returns The new register.
   */
  static create<Target extends Registrable, Tag extends string>(
    target: Target,
    tag: Tag,
    ...uniqueness: Any[]
  ) {
    const { hash: id, keys } = hash(target, tag, ...uniqueness);

    const exists = this.cache.has(id);
    if (!exists) {
      this.cache.set(id, new RegisterBuilder(id, keys, tag, target));
    }

    const item = this.cache.get(id);
    if (!item) {
      throw new RegistryPanic('NotFound', 'Register not found');
    }

    return item as Register<Target, Tag>;
  }
}

export { Registry, RegistryPanic };
export type { Register, Registrable };
