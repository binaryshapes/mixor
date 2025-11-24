/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { n } from '@nuxo/core';

import { DEFAULT_ERROR_MODE } from './constants.ts';
import type { EventManager } from './event.ts';
import type { Schema, SchemaErrors, SchemaValues } from './schema.ts';
import type { Specification } from './specification.ts';
import type { TypeOf } from './types.ts';

/**
 * The tag for the aggregate component.
 *
 * @internal
 */
const AGGREGATE_TAG = 'Aggregate' as const;

/**
 * The ports of the aggregate.
 *
 * @internal
 */
type AggregatePorts = Record<string, n.Port<n.Any>>;

/**
 * The specifications of the aggregate.
 *
 * @internal
 */
type AggregateSpecs = Record<string, Specification<n.Any, string>>;

/**
 * Defines the types of the adapters of the aggregate.
 *
 * @typeParam D - The type of the ports of the aggregate.
 */
type AggregateAdapters<D extends AggregatePorts> = {
  [K in keyof D]: D[K]['Type'];
};

/**
 * The aggregate component.
 *
 * @typeParam Self - The self of the aggregate.
 * @typeParam T - The type of the schema values.
 * @typeParam E - The type of the events.
 * @typeParam Specs - The type of the specifications.
 * @typeParam Ports - The type of the ports.
 *
 * @public
 */
type Aggregate<
  Self,
  T extends SchemaValues,
  E,
  Specs extends AggregateSpecs,
  Ports extends AggregatePorts,
> = n.Component<
  typeof AGGREGATE_TAG,
  Self & {
    Errors: SchemaErrors<T, typeof DEFAULT_ERROR_MODE>;
    schema: Schema<T>;
    events: EventManager<E>;
    specs: Specs;
    ports: Ports;
    adapters: AggregateAdapters<Ports>;
  },
  Self
>;

/**
 * Panic error for the aggregate module.
 * Raised when the aggregate is invalid or cannot be built.
 *
 * - SchemaNotSet: The aggregate schema is not set.
 * - EventsNotSet: The aggregate events are not set.
 *
 * @public
 */
class AggregatePanic
  extends n.panic<typeof AGGREGATE_TAG, 'SchemaNotSet' | 'EventsNotSet'>(AGGREGATE_TAG) {}

/**
 * Creates an aggregate using the given config settings.
 *
 * @param config - The config for the aggregate.
 * @returns The aggregate class.
 *
 * @internal
 */
const createAggregate = <
  T extends SchemaValues,
  E,
  Specs extends AggregateSpecs = never,
  Ports extends AggregatePorts = never,
  Adapters extends AggregateAdapters<Ports> = never,
>(
  config: {
    schema: Schema<T>;
    events: EventManager<E>;
    specs?: Specs;
    ports?: Ports;
    adapters?: Adapters;
  },
) => {
  // Schema is mandatory.
  if (!config.schema) {
    throw new AggregatePanic(
      'SchemaNotSet',
      'The aggregate schema is not set',
      'You must use "schema" method in order to set the schema',
    );
  }

  // Events are mandatory.
  if (!config.events) {
    throw new AggregatePanic(
      'EventsNotSet',
      'The aggregate events are not set',
      'You must use "events" method in order to set the events',
    );
  }

  const aggregateClass = class Aggregate {
    /**
     * The state of the aggregate.
     */
    public state: TypeOf<Schema<T>> = {} as TypeOf<Schema<T>>;

    /**
     * The schema of the aggregate.
     */
    protected schema: Schema<T> = config.schema;

    /**
     * The events of the aggregate.
     */
    protected events: EventManager<E> = config.events;

    /**
     * The specs of the aggregate.
     */
    protected specs: Specs = config.specs ?? undefined as unknown as Specs;

    /**
     * The ports of the aggregate.
     */
    protected ports: Ports = config.ports ?? undefined as unknown as Ports;

    /**
     * The adapters of the aggregate.
     */
    protected static adapters: AggregateAdapters<Ports> = config.adapters ??
      undefined as unknown as AggregateAdapters<Ports>;

    /**
     * Constructor for the aggregate.
     *
     * @param values - The values to set.
     */
    public constructor(values: TypeOf<Schema<T>>) {
      this.state = values;
    }

    /**
     * Sets a field value with schema validation.
     *
     * @remarks
     * Uses the schema to validate the value.
     *
     * @param key - The field name to set.
     * @param value - The value to set.
     * @param mode - The validation mode.
     * @returns The result of the validation.
     */
    public set<
      K extends keyof SchemaErrors<T, Mode> & keyof typeof this.state,
      Mode extends n.ErrorMode,
    >(
      key: K,
      value: (typeof this.state)[K],
      mode: Mode = 'all' as Mode,
    ): n.Result<void, SchemaErrors<T, Mode>[K]> {
      const validationResult = this.schema.values[key](
        value,
        mode,
      ) as n.Result<
        (typeof this.state)[K],
        SchemaErrors<T, Mode>[K]
      >;

      // If the validation fails, return the error.
      if (n.isErr(validationResult)) {
        return validationResult;
      }

      // If the validation succeeds, update the state.
      this.state[key] = validationResult.value;
      return n.ok(undefined);
    }

    /**
     * Retrieves and removes all events from the store.
     *
     * @returns The events that were in the store.
     */
    public pullEvents() {
      return this.events.pull();
    }

    /**
     * Creates a new aggregate instance with the given values.
     *
     * @param values - The values to set.
     * @param mode - The validation mode.
     * @returns The result of the validation.
     */
    public static create<
      Self extends new (...args: n.Any[]) => n.Any,
      Mode extends n.ErrorMode = typeof DEFAULT_ERROR_MODE,
    >(
      this: Self,
      values: TypeOf<Schema<T>>,
      mode: Mode = DEFAULT_ERROR_MODE as Mode,
    ): n.Result<InstanceType<Self>, SchemaErrors<T, Mode>> {
      // Validate the values using the schema.
      const validationResult = config.schema(values, mode);

      if (n.isErr(validationResult)) {
        return validationResult;
      }

      // Fancy inspect for the aggregate instance.
      const aggregateInstance = new (this as n.Any)(validationResult.value);
      n.setInspect(aggregateInstance, () => aggregateInstance.state);

      // Ensure the aggregate instance is of the correct type.
      return n.ok(aggregateInstance as InstanceType<Self>);
    }
  };

  // Here when the aggregate component is created and registered.
  const aggregateComponent = n.component(AGGREGATE_TAG, aggregateClass, {
    schema: config.schema,
    events: config.events,
    specs: Object.values(config.specs ?? {}),
    ports: config.ports ?? {},
  });

  // Add the schema, events, specs and ports for uniqueness.
  n.meta(aggregateComponent)
    .children(
      config.schema,
      config.events,
      ...Object.values(config.specs ?? {}),
      ...Object.values(config.ports ?? {}),
    );

  return aggregateComponent as Aggregate<typeof aggregateClass, T, E, Specs, Ports>;
};

/**
 * Creates an aggregate using the given configuration.
 *
 * @remarks
 * Under the hood, this function creates a new provider that will be used to register the aggregate
 * in a container and resolve the adapters defined in the aggregate.
 *
 * @param config - The config for the aggregate.
 * @param extend - The extend method for the aggregate.
 * @returns The aggregate class as a provider ready to be used in a container.
 *
 * @public
 */
const aggregate = <
  Self,
  T extends SchemaValues,
  E,
  Specs extends AggregateSpecs = never,
  Ports extends AggregatePorts = never,
>(
  config: {
    schema: Schema<T>;
    events: EventManager<E>;
    specs?: Specs;
    ports?: Ports;
  },
  extend: (
    Aggregate: ReturnType<typeof createAggregate<T, E, Specs, Ports, AggregateAdapters<Ports>>>,
  ) => Self,
) =>
  n.provider()
    // This is important to ensure that the ports are defined in the container.
    .use(config.ports ?? {} as unknown as Ports)
    .provide((adapters) => extend(createAggregate({ ...config, adapters })));

export { aggregate };
export type { Aggregate };
