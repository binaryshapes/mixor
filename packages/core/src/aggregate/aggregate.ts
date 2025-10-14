/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type Port, type Service } from '../di';
import { isErr, ok, type Result } from '../result';
import type { Schema, SchemaErrors, SchemaValues } from '../schema';
import { type Component, component, type ErrorMode, Panic, type Registrable } from '../system';
import { type Any, setInspect } from '../utils';
import type { EventManager } from './event';
import type { Specification } from './specification';

/**
 * The dependencies of the aggregate.
 *
 * @internal
 */
type AggregateDeps = Record<string, Port<Any> | Service<Any, Any>>;

/**
 * The specifications of the aggregate.
 *
 * @internal
 */
type AggregateSpecs = Record<string, Specification<Any, Any>>;

/**
 * Panic error for the aggregate module.
 * Raised when the aggregate is invalid or cannot be built.
 *
 * - SchemaNotSet: The aggregate schema is not set.
 * - EventsNotSet: The aggregate events are not set.
 *
 * @public
 */
class AggregatePanic extends Panic<'Aggregate', 'SchemaNotSet' | 'EventsNotSet'>('Aggregate') {}

/**
 * Builder class for an aggregate.
 *
 * @remarks
 * Contains the schema, events, specs and deps of the aggregate.
 *
 * @internal
 */
class AggregateBuilder<
  T = never,
  E = never,
  Specs extends AggregateSpecs = never,
  Deps extends AggregateDeps = never,
> {
  public _schema: Schema<T>;
  public _events: EventManager<E>;
  public _specs: Specs | undefined;
  public _deps: Deps | undefined;

  public constructor() {
    this._schema = undefined as unknown as Schema<T>;
    this._events = undefined as unknown as EventManager<E>;
    this._specs = undefined;
    this._deps = undefined;
  }

  /**
   * Sets the schema of the aggregate.
   *
   * @param schema - The schema to set.
   * @returns The aggregate builder.
   */
  public schema<TT>(schema: Schema<TT>) {
    this._schema = schema as unknown as Schema<T>;
    return this as unknown as AggregateBuilder<TT, E, Specs, Deps>;
  }

  /**
   * Sets the events of the aggregate.
   *
   * @param events - The events to set.
   * @returns The aggregate builder.
   */
  public events<EE>(events: EventManager<EE>) {
    this._events = events as unknown as EventManager<E>;
    return this as unknown as AggregateBuilder<T, EE, Deps, Specs>;
  }

  /**
   * Sets the specs of the aggregate.
   *
   * @param specs - The specs to set.
   * @returns The aggregate builder.
   */
  public specs<SS extends AggregateSpecs>(specs: SS) {
    this._specs = specs as unknown as Specs;
    return this as unknown as AggregateBuilder<T, E, SS, Deps>;
  }

  /**
   * Sets the deps of the aggregate.
   *
   * @param deps - The deps to set.
   * @returns The aggregate builder.
   */
  public deps<DD extends AggregateDeps>(deps: DD) {
    this._deps = deps as unknown as Deps;
    return this as unknown as AggregateBuilder<T, E, Specs, DD>;
  }

  /**
   * Build the aggregate class.
   *
   * @returns The aggregate component.
   * @throws AggregatePanic: If the aggregate schema is not set.
   * @throws AggregatePanic: If the aggregate events are not set.
   */
  public build() {
    if (!this._schema) {
      throw new AggregatePanic(
        'SchemaNotSet',
        'The aggregate schema is not set',
        'You must use "schema" method in order to set the schema',
      );
    }

    if (!this._events) {
      throw new AggregatePanic(
        'EventsNotSet',
        'The aggregate events are not set',
        'You must use "events" method in order to set the events',
      );
    }

    return createAggregate(this);
  }
}

/**
 * Creates an aggregate using the given builder settings.
 *
 * @param builder - The builder for the aggregate.
 * @returns The aggregate class.
 *
 * @internal
 */
const createAggregate = <T, E, Deps extends AggregateDeps, Specs extends AggregateSpecs>(
  builder: AggregateBuilder<T, E, Deps, Specs>,
) => {
  const aggregateClass = class Aggregate {
    /**
     * The state of the aggregate.
     */
    public state: SchemaValues<T> = {} as SchemaValues<T>;
    /**
     * The schema of the aggregate.
     */
    public schema = builder._schema;

    /**
     * The events of the aggregate.
     */
    public events = builder._events;

    /**
     * The specs of the aggregate.
     */
    public specs = builder._specs;

    /**
     * The dependencies of the aggregate.
     */
    public deps = builder._deps;

    /**
     * Constructor for the aggregate.
     *
     * @param values - The values to set.
     */
    public constructor(values: SchemaValues<T>) {
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
    public set<E extends ErrorMode, K extends keyof SchemaErrors<T, E> & keyof typeof this.state>(
      key: K,
      value: (typeof this.state)[K],
      mode: E = 'all' as E,
    ): Result<void, SchemaErrors<T, E>[K]> {
      const validationResult = (builder._schema.fields as Any)[key](
        value,
        mode,
      ) as Result<
        (typeof this.state)[K],
        SchemaErrors<T, E>[K]
      >;

      // If the validation fails, return the error.
      if (isErr(validationResult)) {
        return validationResult;
      }

      // If the validation succeeds, update the state.
      this.state[key] = validationResult.value;
      return ok(undefined);
    }

    /**
     * Creates a new aggregate instance with the given values.
     *
     * @param values - The values to set.
     * @param mode - The validation mode.
     * @returns The result of the validation.
     */
    public static create<Self extends typeof Aggregate, Mode extends ErrorMode = never>(
      this: Self,
      values: SchemaValues<T>,
      mode?: Mode,
    ): Result<InstanceType<Self>, SchemaErrors<T, Mode>> {
      // Validate the values using the schema.
      const validationResult = builder._schema(values, mode);

      if (isErr(validationResult)) {
        return validationResult;
      }

      // Fancy inspect for the aggregate instance.
      const aggregateInstance = new (this as unknown as typeof Aggregate)(validationResult.value);
      setInspect(aggregateInstance, () => aggregateInstance.state);

      // Ensure the aggregate instance is of the correct type.
      return ok(aggregateInstance as unknown as InstanceType<Self>);
    }
  };

  // Here when the aggregate component is created and registered.
  return component('Aggregate', aggregateClass, { ...Object.values(builder) })
    // Add the schema, events, specs and deps for uniqueness.
    .addChildren(
      builder._schema,
      builder._events,
      ...Object.values(builder._specs ?? {}),
      ...Object.values(builder._deps ?? {}),
    ) as unknown as Aggregate<typeof aggregateClass>;
};

/**
 * The aggregate component.
 *
 * @typeParam Self - The self of the aggregate.
 *
 * @internal
 */
type Aggregate<Self extends Registrable> = Component<'Aggregate', Self>;

/**
 * Creates a new aggregate component.
 *
 * @remarks
 * An aggregate is a domain-driven concept representing a consistency boundary that encapsulates
 * a cluster of related objects and enforces invariants within that boundary.
 * In the context of the Nuxo library, an aggregate is a {@link Component} type that provides
 * a schema, domain events, and specifications, allowing you to construct, validate, and operate on
 * strongly-typed domain entities in a consistent and composable manner.
 *
 * @typeParam T - The type of the aggregate.
 * @typeParam E - The type of the events.
 * @typeParam Deps - The type of the dependencies.
 * @typeParam Specs - The type of the specifications.
 *
 * @returns The aggregate component.
 *
 * @internal
 */
const aggregate = <T, E, Deps extends AggregateDeps, Specs extends AggregateSpecs>() =>
  new AggregateBuilder<T, E, Deps, Specs>();

export { aggregate };
