/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type PrimitiveTypeExtended, setInspect } from './utils';

/**
 * @fileOverview Data Container Module.
 *
 * This module provides a secure data container that wraps values with privacy controls,
 * serialization capabilities, and type information. It's designed to handle sensitive
 * data with built-in redaction capabilities for safe logging and debugging.
 *
 * Key features:
 * - Data redaction for sensitive information protection.
 * - Automatic serialization (JSON, string) with privacy controls.
 * - Type detection (primitive vs record).
 * - Immutable configuration with mutable data.
 */

/**
 * The placeholder value used when data is redacted.
 *
 * @internal
 */
const REDACTED_VALUE = '<Redacted>';

/**
 * Supported data value types for the Data container.
 *
 * @remarks
 * This type represents all possible values that can be stored in a Data container,
 * including primitives, null, undefined, and plain objects with primitive values.
 *
 * @public
 */
type DataValue =
  | PrimitiveTypeExtended
  | null
  | undefined
  | Record<string, PrimitiveTypeExtended | null | undefined>;

/**
 * Classification of the data type stored in the container.
 *
 * @remarks
 * - `primitive`: Numbers, strings, booleans, symbols, bigints.
 * - `record`: Plain objects (excluding arrays and special objects).
 *
 * @internal
 */
type DataType = 'record' | 'primitive';

/**
 * Configuration options for Data container behavior.
 *
 * @internal
 */
type DataConfig = {
  /**
   * Whether to redact the data value when serializing or inspecting.
   *
   * @remarks
   * Data redaction is the process of permanently removing or obscuring sensitive information
   * from the data value before sharing or publishing it. When enabled, all serialization
   * methods (toString, toJSON) and inspection will return the redacted placeholder instead
   * of the actual value.
   *
   * @default false
   */
  redacted?: boolean;
};

/**
 * A secure data container that wraps values with privacy controls and serialization capabilities.
 *
 * @remarks
 * The Data class provides a wrapper around any value with built-in support for:
 * - Data redaction for sensitive information protection
 * - Automatic type detection (primitive vs record)
 * - Safe serialization methods that respect privacy settings
 * - Immutable configuration with mutable data storage
 *
 * This is particularly useful for handling sensitive data in logging, debugging,
 * and serialization scenarios where you need to protect confidential information.
 *
 * @typeParam D - The type of data value being stored.
 *
 * @internal
 */
class Data<D extends DataValue> {
  /**
   * The classification type of the stored data.
   *
   * @internal
   */
  private dataType: DataType;

  /**
   * Creates a new Data container instance.
   *
   * @param dataValue - The value to wrap in the container.
   * @param dataConfig - Configuration options for the container behavior
   *
   * @internal
   */
  public constructor(private dataValue: D, private readonly dataConfig: DataConfig) {
    this.dataType = typeof this.value === 'object' ? 'record' : 'primitive';

    // Configure inspection to respect redaction settings.
    setInspect(this, () => this.getRedactedValue());
  }

  /**
   * Gets the redacted value if redaction is enabled, otherwise returns the actual value.
   *
   * @returns The redacted placeholder or the actual data value
   *
   * @internal
   */
  private getRedactedValue() {
    return this.dataConfig.redacted ? REDACTED_VALUE : this.dataValue;
  }

  /**
   * Gets the classification type of the stored data.
   *
   * @returns Either 'primitive' for basic types or 'record' for objects.
   *
   * @public
   */
  public get type(): DataType {
    return this.dataType;
  }

  /**
   * Gets the actual stored data value.
   *
   * @remarks
   * This always returns the actual value, regardless of redaction settings.
   * Use this when you need access to the real data within your application logic.
   *
   * @returns The actual data value.
   *
   * @public
   */
  public get value(): D {
    return this.dataValue;
  }

  /**
   * Gets the configuration object for this Data container.
   *
   * @returns The configuration object (read-only).
   *
   * @public
   */
  public get config(): DataConfig {
    return this.dataConfig;
  }

  /**
   * Updates the stored data value.
   *
   * @param value - The new value to store.
   *
   * @public
   */
  public set(value: D): void {
    this.dataValue = value;
  }

  /**
   * Converts the data to a string representation, respecting redaction settings.
   *
   * @remarks
   * - For objects: Returns formatted JSON string.
   * - For primitives: Returns the string representation.
   * - If redacted: Returns the redacted placeholder.
   *
   * @returns String representation of the data.
   *
   * @public
   */
  public toString() {
    const redactedValue = this.getRedactedValue();
    if (typeof redactedValue === 'object') {
      return JSON.stringify(redactedValue, null, 2);
    }

    return redactedValue;
  }

  /**
   * Converts the data to JSON representation, respecting redaction settings.
   *
   * @remarks
   * This method is called automatically by JSON.stringify() and other serialization
   * methods. It respects the redaction configuration.
   *
   * @returns JSON-serializable representation of the data.
   *
   * @public
   */
  public toJSON() {
    return this.getRedactedValue();
  }
}

/**
 * Default configuration for Data containers.
 *
 * @internal
 */
const DATA_CONFIG_DEFAULT: DataConfig = {
  redacted: false,
};

/**
 * Factory function to create a new Data container instance.
 *
 * @remarks
 * This is the primary way to create Data containers. It provides a clean API
 * with sensible defaults while allowing customization through the config parameter.
 *
 * @typeParam D - The type of data value being stored.
 *
 * @param value - The value to wrap in the container.
 * @param config - Optional configuration options (defaults to non-redacted).
 *
 * @returns A new Data container instance.
 *
 * @public
 */
const data = <D extends DataValue>(value: D, config: DataConfig = DATA_CONFIG_DEFAULT) =>
  new Data<D>(value, config);

export { data };
export type { Data, DataValue };
