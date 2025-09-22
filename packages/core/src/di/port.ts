/**
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { isSchema, isValue } from '../schema';
import { type Component, Panic, component } from '../system';
import { type Any } from '../utils';
import { type Contract, type ContractHandler, isContract } from './contract';

/**
 * Defines a valid shape of a port.
 *
 * @remarks
 * A port shape is a record of contracts, schemas, or values.
 *
 * @public
 */
type PortShape = Record<string, { Type: Any; Tag: 'Schema' | 'Value' | 'Contract' }>;

/**
 * Port component type.
 *
 * @typeParam T - The shape of the port.
 *
 * @public
 */
type Port<T extends PortShape> = Component<
  'Port',
  T,
  {
    [K in keyof T]: T[K] extends Contract<Any, Any, Any, Any>
      ? ContractHandler<T[K]>
      : T[K]['Type'];
  }
>;

/**
 * Panic error for the port module.
 *
 * - InvalidShape: The port shape is not valid.
 * - InvalidComponent: The port component is not valid.
 *
 * @public
 */
class PortError extends Panic<'Port', 'InvalidShape' | 'InvalidComponent'>('Port') {}

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
  if (typeof shape !== 'object' || shape === null) {
    throw new PortError('InvalidShape', 'A port shape must be an object');
  }

  // Check the given shape meets the requirements.
  const isValid = Object.entries(shape).every(
    ([, value]) => isValue(value) || isSchema(value) || isContract(value),
  );

  if (!isValid) {
    throw new PortError('InvalidComponent', 'A port just can contain contracts, values or schemas');
  }

  return component('Port', shape).addChildren(...Object.values(shape)) as Port<T>;
}

export { PortError, port };
export type { Port, PortShape };
