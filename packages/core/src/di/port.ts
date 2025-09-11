/**
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { type Value, isSchema, isValue } from '../schema';
import { type Component, Panic, type Registrable, component } from '../system';
import { type Any } from '../utils';
import { isContract } from './contract';

/**
 * Port shape.
 *
 * @remarks
 * A port structure is a record of contracts, schemas, or values.
 *
 * @public
 */
type PortShape = Record<string, Component<'Contract' | 'Schema', Registrable> | Value<Any, Any>>;

/**
 * Port type.
 *
 * @public
 */
type Port<T extends PortShape = PortShape> = Component<
  'Port',
  T,
  {
    // Inherit the type of the port shape (contracts, schemas, or values).
    [K in keyof T]: T[K]['Type'];
  }
>;

/**
 * Panic error for the port module.
 *
 * - InvalidShape: The port shape is not valid.
 *
 * @public
 */
class PortError extends Panic<'Port', 'InvalidShape'>('Port') {}

/**
 * Creates a new port with the specified shape.
 *
 * @remarks
 * A port is a component that defines a set of methods and properties that must be implemented
 * by the component that consumes the port through an {@link adapter}.
 *
 * @typeParam T - The shape of the port (contracts, schemas, or values).
 * @param shape - The shape of the port.
 * @returns A new port.
 *
 * @public
 */
function port<T extends PortShape>(shape: T) {
  if (typeof shape !== 'object') {
    throw new PortError('InvalidShape', 'A port shape must be an object');
  }

  // Check the given shape meets the requirements.
  const isValid = Object.entries(shape).every(
    ([, value]) => isValue(value) || isSchema(value) || isContract(value),
  );

  if (!isValid) {
    throw new PortError('InvalidShape', 'A port just can contain contracts, values or schemas');
  }

  return component('Port', shape).addChildren(...Object.values(shape)) as Port<T>;
}

export { PortError, port };
export type { Port, PortShape };
