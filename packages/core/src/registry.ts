/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import fs from 'node:fs';

import { config } from './config.ts';
import type { Any } from './generics.ts';
import { logger } from './logger.ts';
import { panic } from './panic.ts';
import { hash, isClass, merge } from './utils.ts';

/**
 * Register type definition for registry entries.
 *
 * Represents a registered object with its metadata and identification properties.
 * Each register has a unique identifier, tag, and reference count for tracking usage.
 *
 * @typeParam Tag - The string tag that identifies the type of register.
 * @typeParam Extra - The extra metadata type for the register (if necessary).
 *
 * @public
 */
type Register<Tag extends string, Extra extends Record<string, Any>> = {
  /**
   * The type-level tag identifier for the register.
   */
  Tag: Tag;

  /**
   * The type-level extra metadata for the register.
   */
  Extra: Extra;

  /**
   * Unique identifier of the register instance.
   * Generated from tag, target, and uniqueness parameters.
   */
  id: string;

  /**
   * Unique identifier for the specific meta instance of the register.
   * Generated from the register id and reference count.
   */
  metaId: string;

  /**
   * Array of keys used to generate the unique identifier.
   * Contains the tag, target, and uniqueness parameters.
   */
  keys: string[];

  /**
   * The string tag value of the register.
   *
   * @remarks
   * Used to categorize and identify registry records by their type.
   */
  tag: Tag;

  /**
   * The reference count indicating how many times this register has been instantiated.
   * Increments each time a new instance is created for the same target.
   */
  refCount: number;
};

/**
 * Internal registry record structure.
 *
 * Represents the complete registry entry containing the register target,
 * optional info object, and optional meta objects indexed by metaId.
 *
 * @typeParam Tag - The tag type for the register.
 * @typeParam Target - The target type of the object.
 * @typeParam Extra - The extra metadata type of the object.
 *
 * @internal
 */
type RegistryRecord<Tag extends string, Target, Extra extends Record<string, Any>> = {
  /**
   * The registered target wrapped with registry properties.
   */
  target: Register<Tag, Extra> & Target;

  /**
   * Optional info object containing object metadata and introspection data.
   */
  info?: Info | undefined;

  /**
   * Optional meta objects indexed by metaId for different instances.
   */
  meta?: Record<string, Meta<Extra>> | undefined;
};

/**
 * Registry-specific panic error class.
 *
 * Handles registry-specific error scenarios including:
 *
 * - `NotFound`: The target is not found in the registry.
 * - `NotFunction`: The target is not a function.
 * - `InvalidChildren`: The children are not valid registered targets.
 * - `InvalidRegister`: The register is not a valid register.
 * - `CannotOverwrite`: The target cannot be overwritten.
 * - `InvalidExportFormat`: The export format is invalid.
 * - `ExportFailed`: The registry export failed with an error.
 * - `InvalidRef`: The referenced objects are not valid registered targets.
 *
 * @public
 */
class RegistryPanic extends panic<
  'Registry',
  | 'NotFound'
  | 'NotFunction'
  | 'InvalidChildren'
  | 'InvalidRegister'
  | 'CannotOverwrite'
  | 'InvalidExportFormat'
  | 'ExportFailed'
  | 'InvalidRef'
>('Registry') {}

/**
 * Object info class for storing relevant information about the registry record.
 *
 * Provides runtime information about the registry record including their type, parameters,
 * documentation, and traceability status.
 *
 * @internal
 */
class Info {
  /**
   * The info properties for the object.
   */
  public props: {
    /**
     * The category classification of the object based on its target type.
     *
     * - function: The object target is a function (callable and traceable).
     * - object: The object target is an object (not callable and not traceable).
     * - class: The object target is a class constructor.
     */
    readonly category: 'function' | 'object' | 'class';

    /**
     * Indicates whether the object can be traced during execution.
     *
     * - true: The object target is a function and can be traced.
     * - false: The object target is an object and cannot be traced.
     *
     * @remarks
     * This is automatically set based on the object category.
     */
    readonly traceable: boolean;

    /**
     * Array of IDs of the objects that reference this object (if any).
     */
    refs: string[];

    /**
     * Array of parameter definitions for function-type objects.
     * Each tuple contains [parameterName, parameterType].
     * Null for non-function objects.
     */
    params?: [name: string, type: string][] | null;

    /**
     * The runtime type string of the object for introspection purposes.
     */
    type?: string | null;

    /**
     * The documentation for the object.
     */
    doc?: {
      /**
       * The title of the documentation.
       */
      title: string | null;

      /**
       * The body of the documentation.
       */
      body: string | null;
    } | null;
  };

  /**
   * Creates a new object info instance for the given target.
   *
   * Automatically determines the object category and traceability
   * based on the target type (function, class, or object).
   *
   * @param target - The object target to create info for.
   */
  public constructor(target: Any) {
    this.props = {
      category: isClass(target) ? 'class' : typeof target === 'function' ? 'function' : 'object',
      traceable: typeof target === 'function',
      type: null,
      params: null,
      refs: [],
      doc: null,
    };
  }

  /**
   * Adds object IDs to the referencedBy array.
   *
   * @param ids - The objects that reference this object.
   * @returns The info instance for method chaining.
   */
  public refs(...refs: Any[]) {
    // Checking if the referenced objects are registered targets.
    const invalid = refs.filter((val) => !isRegistered(val));
    if (invalid.length > 0) {
      throw new RegistryPanic('InvalidRef', 'All referenced objects must be registered targets');
    }

    const refsUniques = new Set([...this.props.refs, ...refs.map((ref) => ref.id)]);
    this.props.refs = Array.from(refsUniques);
    return this;
  }

  /**
   * Sets the runtime type string for the object.
   *
   * @param type - The type string to assign to the object.
   * @returns The info instance for method chaining.
   * @throws RegistryPanic with code `CannotOverwrite` if the type is already set
   * and different from the new type.
   */
  public type(type: string) {
    const alreadySet = this.props.type !== null;
    const areDifferent = alreadySet && this.props.type !== type;
    const areEqual = alreadySet && this.props.type === type;

    // Avoiding to overwrite the type if it is already set and different from the new type.
    if (areDifferent) {
      throw new RegistryPanic(
        'CannotOverwrite',
        `Type already set with value: "${this.props.type}" and cannot be replaced with: "${type}"`,
      );
    }

    // Negative assertion to check if the type is unnecessarily assigned in multiple places.
    logger.assert(
      !areEqual,
      `Type already set with value: "${type}". Check if the type is being set in multiple places`,
    );

    this.props.type = type;
    return this;
  }

  /**
   * Sets the documentation for the object.
   *
   * @param doc - The documentation object containing title and body.
   * @returns The info instance for method chaining.
   * @throws RegistryPanic with code `CannotOverwrite` if the documentation is already set.
   */
  public doc(doc: typeof this.props.doc) {
    if (this.props.doc) {
      throw new RegistryPanic('CannotOverwrite', 'Documentation already set');
    }

    this.props.doc = doc;
    return this;
  }

  /**
   * Sets the parameter definitions for function-type objects.
   *
   * @param params - Variable number of parameter tuples [name, type].
   * @returns The info instance for method chaining.
   * @throws RegistryPanic with code `CannotOverwrite` if the parameters are already set.
   * @throws RegistryPanic with code `NotFunction` if called on non-function objects.
   */
  public params(...params: [name: string, type: string][]) {
    if (this.props.category !== 'function') {
      throw new RegistryPanic('NotFunction', 'Can only set parameters for function targets');
    }

    if (this.props.params && this.props.params.length > 0) {
      throw new RegistryPanic('CannotOverwrite', 'Parameters already set');
    }

    this.props.params = params;
    return this;
  }
}

/**
 * Object meta class for managing object metadata and relationships.
 *
 * Provides a centralized way to manage object metadata including context,
 * name, description, children relationships, and custom extra properties.
 * Each meta instance is associated with a specific register instance via metaId.
 *
 * @typeParam ExtraMeta - The type for additional metadata properties.
 *
 * @internal
 */
class Meta<ExtraMeta extends Record<string, Any>> {
  /**
   * The metadata properties container for the object.
   */
  public props: {
    /**
     * The context string where the object is used or defined.
     */
    context?: string | null;

    /**
     * The display name of the object.
     */
    name?: string | null;

    /**
     * The description of the object's purpose and behavior.
     */
    description?: string | null;

    /**
     * Array of child object IDs that this object contains or references.
     */
    childrenIds: string[];
  } & ExtraMeta;

  /**
   * Creates a new object meta instance.
   *
   * Initializes the meta with default values for context, name, description,
   * and an empty children array.
   */
  public constructor() {
    this.props = {
      context: null,
      name: null,
      description: null,
      childrenIds: [],
    } as unknown as typeof this.props;
  }

  /**
   * Sets the context string for the object.
   *
   * @param context - The context string where the object is used.
   * @returns The meta instance for method chaining.
   */
  public context(context: string) {
    this.props.context = context;
    return this;
  }

  /**
   * Sets the display name for the object.
   *
   * @param name - The display name of the object.
   * @returns The meta instance for method chaining.
   */
  public name(name: string) {
    this.props.name = name;
    return this;
  }

  /**
   * Sets the description for the object.
   *
   * @param description - The description of the object's purpose and behavior.
   * @returns The meta instance for method chaining.
   */
  public describe(description: string) {
    this.props.description = description;
    return this;
  }

  /**
   * Adds child objects to this object's children list.
   *
   * Validates that all provided children are registered targets and
   * maintains uniqueness of child IDs.
   *
   * @param children - Variable number of registered child objects to add.
   * @returns The meta instance for method chaining.
   * @throws RegistryPanic with code `InvalidChildren` if any child is not a registered target.
   */
  public children(...children: Any[]) {
    const invalid = children.filter((val) => !isRegistered(val));

    if (invalid.length > 0) {
      throw new RegistryPanic('InvalidChildren', 'All children must be registered targets');
    }

    const childrenIdsUniques = new Set([
      ...this.props.childrenIds,
      ...children.map((child) => child.id),
    ]);

    this.props.childrenIds = Array.from(childrenIdsUniques);

    return this;
  }

  /**
   * Sets additional custom metadata properties for the object.
   *
   * Merges the provided extra metadata with existing properties,
   * allowing for extensible metadata without modifying the core structure.
   *
   * @param extra - The additional metadata properties to merge.
   * @returns The meta instance for method chaining.
   */
  public extra(extra: ExtraMeta) {
    this.props = { ...this.props, ...extra };
    return this;
  }
}

/**
 * Registry singleton class for managing object registration and metadata.
 *
 * Provides a centralized registry for registering objects, managing their metadata,
 * and tracking their usage through reference counting. Supports both single instances
 * and multiple instances of the same target with unique metaId identifiers.
 *
 * @internal
 */
class Registry {
  /**
   * Internal storage map for registry records.
   * Maps register IDs to their corresponding registry records.
   */
  private static store = new Map<Any, RegistryRecord<string, Any, Any>>();

  /**
   * Generates a unique identifier for a register based on tag, target, and uniqueness parameters.
   *
   * @param tag - The tag string for the register.
   * @param target - The target object to register.
   * @param uniqueness - Additional parameters for uniqueness.
   * @returns Object containing the generated ID and keys used.
   */
  private static getId(tag: string, target: Any, ...uniqueness: Any[]) {
    const { value, keys } = hash(tag, target, ...uniqueness);
    return { id: `${tag}:${value}`.toLowerCase(), keys };
  }

  /**
   * Generates a unique metaId for a specific register instance.
   *
   * @param id - The register ID.
   * @param refCount - The reference count for the instance.
   * @returns The generated metaId string.
   */
  private static metaId(id: string, refCount: number) {
    return `${id}:${refCount}`.toLowerCase();
  }

  /**
   * Creates a new register or returns an existing one with incremented reference count.
   *
   * If a register with the same tag, target, and uniqueness parameters already exists,
   * increments its reference count and returns a new instance with a unique metaId.
   * Otherwise, creates a new register with reference count 1.
   *
   * @param tag - The tag string to categorize the register.
   * @param target - The target object to register.
   * @param uniqueness - Additional parameters to ensure uniqueness.
   * @returns A register object with unique ID and metaId.
   */
  static create<
    Tag extends string,
    Target,
    Extra extends Record<string, Any>,
  >(tag: Tag, target: Target, ...uniqueness: Any[]) {
    const { id, keys } = this.getId(tag, target, ...uniqueness);

    // If the component is already registered, we infer is a new "instance" of the component.
    const reg = this.get(id) as RegistryRecord<Tag, Target, Extra>;
    if (reg) {
      // Increment the reference count of the component.
      reg.target.refCount++;
      const metaId = this.metaId(id, reg.target.refCount);

      // We return a new object with the metaId.
      return merge(reg.target, { metaId });
    }

    // Otherwise, we create a new registry record.
    const record = Object.assign(target as Any, { id, keys, tag, refCount: 1 });
    Object.defineProperty(record, 'name', { value: tag });
    Object.defineProperty(record, 'toString', { value: () => id });

    // XXX: Not all uniqueness need to be merged.
    const merged = merge(record, { metaId: () => this.metaId(id, 1) }, ...uniqueness);

    // Add the registry record to the instances map.
    this.store.set(id, { target: merged });
    return merged as RegistryRecord<Tag, Target, Extra>;
  }

  /**
   * Retrieves a registry record by its ID.
   *
   * @param id - The unique identifier of the register.
   * @returns The registry record if found, undefined otherwise.
   */
  public static get(id: string) {
    return this.store.get(id);
  }

  /**
   * Updates the info or meta data for an existing registry record.
   *
   * @param id - The unique identifier of the register to update.
   * @param data - The info and/or meta data to set.
   * @returns The updated registry record.
   * @throws RegistryPanic if the register does not exist.
   */
  public static set(id: string, data: Pick<RegistryRecord<string, Any, Any>, 'info' | 'meta'>) {
    const reg = this.get(id);

    if (!reg) {
      throw new RegistryPanic('NotFound', 'Register does not exist in the registry');
    }

    if (data.info) {
      reg.info = data.info;
    }

    if (data.meta) {
      reg.meta = data.meta;
    }

    return reg;
  }

  /**
   * Shows the complete information for a registered target.
   *
   * Returns a frozen object containing the register properties, info data,
   * and meta properties merged together for the specific metaId instance.
   *
   * @param target - The registered target to show information for.
   * @returns A frozen object with all register, info, and meta data.
   * @throws RegistryPanic if the target is not a valid register or not found.
   */
  public static show<T extends Register<Any, Any>>(target: T) {
    if (!isRegistered(target)) {
      throw new RegistryPanic('InvalidRegister', 'The given target is not a valid register');
    }

    const reg = this.get(target.id);

    if (!reg) {
      throw new RegistryPanic('NotFound', 'Target does not exist in the registry');
    }

    // Freeze the object to prevent modification.
    return Object.freeze({
      ...reg.target,
      ...reg.info?.props,
      ...reg.meta?.[target.metaId]?.props,
    });
  }

  /**
   * Lists all registry records in the store.
   *
   * @returns An array of all registry records currently stored.
   */
  public static list() {
    return Array.from(this.store.values());
  }

  /**
   * Exports the registry records to a JSON file.
   *
   * @remarks
   * The file is written to the current working directory and the content is replaced each time
   * the method is called if the file already exists.
   *
   * @param filename - The filename to export the registry to. Defaults to
   * {@link config.REGISTRY_FILENAME} configuration variable.
   * @throws RegistryPanic with code `ExportFailed` if the file cannot be written.
   */
  public static export(filename: string = config.get('REGISTRY_FILENAME')) {
    try {
      const content = JSON.stringify(this.list().map((reg) => this.show(reg.target)), null, 2);
      fs.writeFileSync(filename, content, { encoding: 'utf-8', flag: 'w' });
    } catch (error) {
      throw new RegistryPanic('ExportFailed', 'Failed to export the registry: ' + error);
    }
  }
}

/**
 * Gets or creates the info object for a registered target.
 *
 * If the info object does not exist for the register, creates a new Info instance
 * and stores it in the registry. If it already exists, returns the existing instance.
 *
 * @param target - The registered target to get info for.
 * @returns The Info instance for the register.
 * @throws RegistryPanic if the target is not found in the registry.
 *
 * @public
 */
const info = <T extends Register<Any, Any>>(target: T) => {
  const reg = Registry.get(target.id);

  if (!reg) {
    throw new RegistryPanic('NotFound', 'Target does not exist in the registry');
  }

  if (!('info' in reg)) {
    const info = new Info(target);
    Registry.set(target.id, { info });
    return info;
  }

  return reg.info as Info;
};

/**
 * Gets or creates the meta object for a registered target instance.
 *
 * If the meta object does not exist for the specific metaId, creates a new Meta instance
 * and stores it in the registry. If it already exists, returns the existing instance.
 * Each register instance (identified by metaId) can have its own meta object.
 *
 * @param target - The registered target to get meta for.
 * @returns The Meta instance for the specific register instance.
 * @throws RegistryPanic if the target is not found in the registry.
 *
 * @public
 */
const meta = <T extends Register<Any, Any>>(target: T) => {
  const reg = Registry.get(target.id);
  if (!reg) {
    throw new RegistryPanic('NotFound', 'Target does not exist in the registry');
  }

  // Checking if the metaId is already registered.
  let rMeta = reg.meta?.[target.metaId];

  // If the metaId is already registered, we return the existing.
  if (rMeta) {
    return rMeta as Meta<T['Extra']>;
  }

  // Otherwise, we create a new meta and register it.
  rMeta = new Meta();
  Registry.set(target.id, { meta: { ...reg.meta, [target.metaId]: rMeta } });
  return rMeta as Meta<T['Extra']>;
};

/**
 * Type guard function to check if an object is a registered or not.
 *
 * Validates that the object has the required registry properties and exists in the registry store.
 *
 * @param maybeRegistered - The value to check for registry membership.
 * @returns True if the value is a valid registered object, false otherwise.
 *
 * @public
 */
const isRegistered = (maybeRegistered: Any): maybeRegistered is Register<Any, Any> =>
  !!maybeRegistered && !!maybeRegistered.id && !!Registry.get(maybeRegistered.id);

/**
 * Registry singleton instance alias.
 *
 * Provides access to the Registry class static methods for object registration, retrieval, export,
 * and other management operations.
 *
 * @public
 */
const registry = Registry;

export { info, isRegistered, meta, registry, RegistryPanic };
export type { Register };
