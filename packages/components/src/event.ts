/**
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { n } from '@nuxo/core';

import type { Value } from './value.ts';

/**
 * The tag for the event component.
 *
 * @internal
 */
const EVENT_TAG = 'Event' as const;

/**
 * The tag for the event manager component.
 *
 * @internal
 */
const EVENT_MANAGER_TAG = 'EventManager' as const;

/**
 * Type for an event data structure containing key and value.
 *
 * @typeParam K - The event key type.
 * @typeParam T - The event value type.
 *
 * @internal
 */
type EventData<K, T> = n.Pretty<{
  key: K;
  value: T;
  timestamp: number;
}>;

/**
 * Converts an array of events to a record of values for type inference.
 *
 * @typeParam T - The array of events to convert.
 * @returns The record of values with proper type inference.
 *
 * @internal
 */
type EventListToRecord<T extends Event<n.Any, Value<n.Any, n.Any>>[]> = n.Pretty<
  {
    [K in T[number]['key']]: Extract<T[number], { key: K }>['value'];
  }
>;

/**
 * Extracts the actual value types from a record of Value wrappers.
 * This type utility converts `Value<T, E>` to `T` for each property.
 *
 * @typeParam T - The record of Value wrappers.
 * @returns The record with actual value types instead of Value wrappers.
 *
 * @internal
 */
type EventValue<T extends Record<n.Any, Value<n.Any, n.Any>>> = n.Pretty<
  {
    [K in keyof T]: T[K] extends Value<infer N extends n.DataValue, n.Any> ? N : T[K];
  }
>;

/**
 * Type for an event constructor function that creates typed events.
 * Extends the Traceable type to provide event-specific functionality.
 *
 * @typeParam K - The event key type.
 * @typeParam T - The event value type.
 *
 * @public
 */
type Event<K, T> = n.Component<
  typeof EVENT_TAG,
  EventData<K, T> & {
    key: K;
    values: string[];
    (value: T): EventData<K, T>;
  },
  EventData<K, T>
>;

/**
 * Type for an event manager component.
 *
 * @typeParam R - The record type mapping event keys to their value types.
 *
 * @public
 */
type EventManager<R> = n.Component<typeof EVENT_MANAGER_TAG, EventStore<R>>;

/**
 * Panic error for the event module.
 * Used when an invalid event key is provided to the event store.
 *
 * - `InvalidKeyError`: The event key is not a valid key in the event store.
 * - `DuplicateKeyError`: All events must have a unique key.
 *
 * @public
 */
class EventPanic extends n.panic<'Event', 'InvalidKeyError' | 'DuplicateKeyError'>('Event') {}

/**
 * Type-safe event store class that manages multiple event types.
 * Provides methods to add, retrieve, and manage events with full type safety.
 * Each event constructor must have a unique key.
 *
 * @typeParam R - The record type mapping event keys to their value types.
 *
 * @internal
 */
class EventStore<R> {
  /**
   * The store of events.
   */
  private readonly store: n.Any[];

  /**
   * The map of event constructors.
   */
  private readonly eventMap: Record<string, Event<n.Any, n.Any>>;

  /**
   * The available event keys in the store.
   */
  public readonly keys: (keyof R)[];

  /**
   * Creates a new EventStore instance from a list of event constructors.
   *
   * @param events - The event constructors to include in the store (variadic parameters).
   */
  constructor(...events: Event<n.Any, n.Any>[]) {
    this.eventMap = {};
    this.store = [];

    // Creating map <EventKey:EventConstructor>.
    for (const ev of events) {
      // Checking if the event key is already registered (duplicate keys are not allowed).
      if (this.eventMap[ev.key]) {
        throw new EventPanic(
          'DuplicateKeyError',
          'All events must have a unique key.',
          n.doc`
          The event key "${ev.key}" is already registered.
          Please check the events:
            - Already registered event: ${this.eventMap[ev.key]}
            - Event with duplicate key: ${ev}
          `,
        );
      }

      this.eventMap[ev.key] = ev;
    }

    this.keys = Object.keys(this.eventMap) as (keyof R)[];
  }

  /**
   * Adds a typed event to the store.
   *
   * @param key - The event key (must be one of the keys in the union type R).
   * @param value - The event value (must match the type for the given key).
   */
  public add<K extends keyof R>(key: K, value: R[K]): void {
    const eventConstructor = this.eventMap[key as string];

    if (!eventConstructor) {
      throw new EventPanic(
        'InvalidKeyError',
        `Event constructor not found for key: ${String(key)}`,
      );
    }

    // Filter values from the value object to avoid expose sensitive data.
    const filteredValue = Object.fromEntries(
      Object.entries(value as n.Any).filter(([key]) => eventConstructor.values.includes(key)),
    );

    this.store.push(eventConstructor(filteredValue));
  }

  /**
   * Retrieves and removes all events from the store.
   * Events are returned sorted by timestamp (oldest first by default).
   *
   * @param sort - Sort order for events ('asc' for oldest first, 'desc' for newest first).
   * @returns Array of all events that were in the store.
   */
  public pull(sort: 'asc' | 'desc' = 'asc'): Event<keyof R, R[keyof R]>[] {
    const list = this.sortStore(sort);

    // Clearing the store.
    this.store.splice(0);
    return list;
  }

  /**
   * Lists all events currently in the store without removing them.
   *
   * @param sort - Sort order for events ('asc' for oldest first, 'desc' for newest first).
   * @returns Array of all events in the store.
   */
  public list(sort: 'asc' | 'desc' = 'asc'): Event<keyof R, R[keyof R]>[] {
    return this.sortStore(sort);
  }

  /**
   * Sorts the store events by timestamp.
   *
   * @param sort - Sort order for events ('asc' for oldest first, 'desc' for newest first).
   * @returns Sorted array of events.
   *
   * @internal
   */
  private sortStore(sort: 'asc' | 'desc'): Event<keyof R, R[keyof R]>[] {
    return this.store
      .slice()
      .sort((a, b) => (sort === 'asc' ? a.timestamp - b.timestamp : b.timestamp - a.timestamp));
  }
}

/**
 * Creates a typed event.
 *
 * @remarks
 * A event is a {@link Component} is a key-value pair with information about some important
 * happening in the system.
 *
 * @param def - The event definition containing key and value schema with Value wrappers.
 * @returns A typed event constructor function that accepts actual values.
 *
 * @public
 */
const event = <K extends string, V extends Record<string, Value<n.Any, n.Any>>>(
  def: Omit<EventData<K, V>, 'timestamp'>,
): Event<K, EventValue<V>> => {
  const constructor = (value: EventValue<V>) => ({
    key: def.key,
    value,
    timestamp: Date.now(),
  });

  constructor.key = def.key;
  constructor.values = Object.keys(def.value);

  const eventComponent = n.component(EVENT_TAG, constructor, {
    key: def.key,
    values: constructor.values,
  }) as unknown as Event<K, EventValue<V>>;

  n.info(eventComponent)
    .doc({
      title: 'Event',
      body: `Represents an event in the system.`,
    });

  n.meta(eventComponent)
    .name(`${def.key}`)
    .describe(n.doc`
      Emits an event with the key ${def.key}.
      The event values are ${constructor.values.join(', ')}.
    `)
    .children(...Object.values(def.value));

  return eventComponent;
};

/**
 * Creates a type-safe event manager from a list of event constructors.
 *
 * @remarks
 * The manager is a {@link Component} that provides full type safety for adding and retrieving
 * events. Each event constructor must have a unique key.
 *
 * @param events - The event constructors to include in the manager (variadic parameters).
 * @returns A type-safe event manager with methods to manage events.
 *
 * @public
 */
const events = <E extends Event<n.Any, n.Any>[]>(...events: E) => {
  const eventManagerComponent = n.component(
    EVENT_MANAGER_TAG,
    new EventStore<EventListToRecord<E>>(...events),
  ) as EventManager<
    EventListToRecord<E>
  >;

  // Only set the documentation if it is not already set (first time only).
  if (!n.info(eventManagerComponent).props.doc) {
    n.info(eventManagerComponent)
      .doc({
        title: 'EventManager',
        body: 'A event manager is a component that manages events.',
      });
  }

  n.meta(eventManagerComponent)
    .name(`EventManager for ${events.map((event) => event.key).join(', ')}`)
    .describe(
      n.doc`Event manager that handles the following events:
        ${events.map((event) => `- ${event.key}: ${event.values.join(', ')}`).join('\n')}
        `,
    )
    .children(...events);

  return eventManagerComponent;
};

export { event, EventPanic, events };
export type { Event, EventManager };
