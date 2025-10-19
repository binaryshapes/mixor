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
 * - Mutable data with immutable redaction state.
 */

/**
 * The placeholder value used when data is redacted.
 *
 * @internal
 */
const REDACTED_VALUE = '<Redacted>';

/**
 * Supported data primitive types.
 *
 * @internal
 */
type DataPrimitive = PrimitiveTypeExtended | null | undefined;

/**
 * Supported data record types.
 *
 * @internal
 */
type DataRecord = Record<string, DataPrimitive | DataPrimitive[]>;

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
  | DataPrimitive
  | DataPrimitive[]
  | DataRecord
  | Record<string, DataRecord>;

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
 * A secure data container that wraps values with privacy controls and serialization capabilities.
 *
 * @remarks
 * The Data class provides a wrapper around any value with built-in support for:
 * - Data redaction for sensitive information protection
 * - Automatic type detection (primitive vs record)
 * - Safe serialization methods that respect privacy settings
 * - Mutable data with immutable redaction state
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
  public readonly type: DataType;

  /**
   * The value stored in the data container.
   *
   * @internal
   */
  private value: D;

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
   * @internal
   */
  private isRedacted: boolean = false;

  /**
   * Creates a new Data container instance.
   *
   * @param value - The value to wrap in the container.
   *
   * @internal
   */
  public constructor(value: D) {
    this.value = value;
    this.type = typeof this.value === 'object' ? 'record' : 'primitive';

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
    return this.isRedacted ? REDACTED_VALUE : this.value;
  }

  /**
   * Sets the redacted state of the data container.
   *
   * @returns The data container instance for method chaining.
   *
   * @public
   */
  public redacted() {
    this.isRedacted = true;
    return this;
  }

  /**
   * Updates the stored data value.
   *
   * @param value - The new value to store.
   *
   * @public
   */
  public set(value: D): void {
    this.value = value;
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
  public get(): D {
    return this.value;
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
   * methods. It respects the redaction state.
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
 * Factory function to create a new Data container instance.
 *
 * @remarks
 * This is the primary way to create Data containers. It provides a clean API
 * with sensible defaults.
 *
 * @typeParam D - The type of data value being stored.
 * @param value - The value to wrap in the container.
 *
 * @returns A new Data container instance.
 *
 * @public
 */
const data = <D extends DataValue>(value: D) => new Data<D>(value);

export { data };
export type { Data, DataValue };
