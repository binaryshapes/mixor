/**
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { type Component, type Registrable, component } from '../system';
import type { Any } from '../utils';
import type { Port, PortShape } from './port';

/**
 * Adapter component type.
 *
 * @typeParam P - The type of the port.
 *
 * @public
 */
type Adapter<P extends Port<PortShape>> = Component<
  'Adapter',
  P['Type'] & {
    dependencies?: Port<Any>[];
  },
  // Inherit the type of the port.
  Port<P>['Type']
>;

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
  component('Adapter', build as Registrable, port)
    // Adding the port as a child.
    .addChildren(...Object.values(port)) as Adapter<Port<P>>;

export { adapter };
export type { Adapter };
