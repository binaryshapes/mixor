/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type Component, component, isComponent } from './component.ts';
import { isImplementation } from './contract.ts';
import type { Any } from './generics.ts';
import { panic } from './panic.ts';
import type { Port, PortShape } from './port.ts';
import { meta } from './registry.ts';

/**
 * The tag for the adapter component.
 *
 * @internal
 */
const ADAPTER_TAG = 'Adapter' as const;

/**
 * The type of the implementation of the port.
 *
 * @typeParam S - The shape of the port.
 *
 * @internal
 */
type AdapterImplementation<S extends PortShape> = {
  [K in keyof S]: S[K]['Implementation'];
};

/**
 * The type of the adapter.
 *
 * @typeParam S - The shape of the port.
 * @typeParam A - The adapter implementation (record of implementations).
 *
 * @public
 */
type Adapter<A extends AdapterImplementation<S>, S extends PortShape> = Component<
  typeof ADAPTER_TAG,
  (() => A) & { port: Port<S> },
  A
>;

/**
 * The panic error for the adapter component.
 *
 * @public
 */
class AdapterPanic extends panic<typeof ADAPTER_TAG, 'InvalidAdapter'>(ADAPTER_TAG) {}

/**
 * Creates a new adapter component for the given port.
 *
 * @remarks
 * An adapter provides concrete implementations for all contracts in a port.
 * Each function in the adapter must be an {@link Implementation} component
 * that implements the corresponding contract in the port.
 *
 * @typeParam S - The shape of the port.
 * @typeParam A - The adapter implementation (record of implementations).
 * @param port - The port to create an adapter for.
 * @param adapterFn - The adapter implementation. Each key must correspond to a contract
 *   in the port, and each value must be an implementation of that contract.
 * @returns A new adapter component.
 * @throws {AdapterPanic} If any adapter function is not a valid implementation.
 *
 * @public
 */
const adapter = <S extends PortShape, A extends AdapterImplementation<S>>(
  port: Port<S>,
  adapterFn: A,
) => {
  // Each adapter function must be an implementation.
  for (const [key, fn] of Object.entries(adapterFn) as [keyof S, Any][]) {
    if (!isImplementation(fn)) {
      throw new AdapterPanic(
        'InvalidAdapter',
        'Adapter function must be an implementation',
        `The adapter function for the key ${String(key)} must be an implementation`,
      );
    }
  }

  const adapterComponent = component(ADAPTER_TAG, () => adapterFn, { port });
  meta(adapterComponent).children(port);
  return adapterComponent as Adapter<A, S>;
};

/**
 * Type guard function that determines whether an object is an adapter.
 *
 * @param maybeAdapter - The object to check.
 * @returns True if the object is an adapter, false otherwise.
 *
 * @public
 */
const isAdapter = (maybeAdapter: Any): maybeAdapter is Adapter<Any, PortShape> =>
  isComponent(maybeAdapter, ADAPTER_TAG);

export { adapter, AdapterPanic, isAdapter };
export type { Adapter, AdapterImplementation };
