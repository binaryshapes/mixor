/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type Component, component, isComponent } from './component.ts';
import type { Any } from './generics.ts';

/**
 * The tag for the port component.
 *
 * @internal
 */
const PORT_TAG = 'Port' as const;

/**
 * The shape of the port.
 * It is a record of contracts.
 *
 * @internal
 */
// TODO: This must be more restricted only for primitives or contract components.
type PortShape = Record<string, Any>;

/**
 * The signature of the port.
 *
 * @typeParam S - The shape of the port.
 *
 * @internal
 */
type PortSignature<S extends PortShape> = {
  [K in keyof S]: S[K]['Implementation'];
};

/**
 * The type of the port.
 *
 * @typeParam S - The shape of the port.
 *
 * @public
 */
type Port<S extends PortShape> = Component<
  typeof PORT_TAG,
  PortSignature<S> & S
>;

/**
 * Creates a new port from the given shape.
 *
 * @typeParam S - The shape of the port.
 * @param port - The shape of the port (a record of contract components).
 * @returns A new port component.
 *
 * @public
 */
const port = <S extends PortShape>(port: S): Port<S> => component(PORT_TAG, port) as Port<S>;

/**
 * Type guard function that determines whether an object is a port.
 *
 * @param maybePort - The object to check.
 * @returns True if the object is a port, false otherwise.
 *
 * @public
 */
const isPort = (maybePort: Any): maybePort is Port<PortShape> => isComponent(maybePort, PORT_TAG);

export { isPort, port };
export type { Port, PortShape };
