/**
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { type Component, component, isComponent, type Registrable } from '../system';
import type { Any } from '../utils';
import type { Port, PortShape } from './port';

/**
 * Adapter component type.
 *
 * @typeParam P - The type of the port.
 *
 * @public
 */
type Adapter<P extends Port<PortShape>> = Component<'Adapter', P['Type'] & { port: P }>;

/**
 * Creates a new adapter with the specified port and builder function.
 *
 * @remarks
 * An adapter is a component that implements a specific port. Automatically adds the port
 * as a child.
 *
 * @typeParam T - The type of the port.
 * @param port - The port to create the adapter from.
 * @param build - The builder function that creates the adapter.
 * @returns A new adapter.
 *
 * @public
 */
const adapter = <P extends PortShape>(port: Port<P>, build: Port<P>['Type']) =>
  component('Adapter', build as Registrable, { port })
    // Adding the port as a child.
    .addChildren(port) as Adapter<Port<P>>;

/**
 * Guard function to check if the given object is an adapter.
 *
 * @param maybeAdapter - The object to check.
 * @returns True if the object is an adapter, false otherwise.
 *
 * @public
 */
const isAdapter = (maybeAdapter: Any): maybeAdapter is Adapter<Port<PortShape>> =>
  isComponent(maybeAdapter, 'Adapter');

export { adapter, isAdapter };
export type { Adapter };
