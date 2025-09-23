/**
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { Value } from '../schema';
import { type Component, Panic, component } from '../system';
import type { Any, Prettify } from '../utils';

/**
 * Type for an event data structure containing key and value.
 *
 * @typeParam K - The event key type.
 * @typeParam T - The event value type.
 *
 * @internal
 */
type EventData<K, T> = Prettify<{
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
type EventListToRecord<T extends Event<Any, Value<Any, Any>>[]> = Prettify<{
  [K in T[number]['key']]: Extract<T[number], { key: K }>['value'];
}>;

/**
 * Extracts the actual value types from a record of Value wrappers.
 * This type utility converts `Value<T, E>` to `T` for each property.
 *
 * @typeParam T - The record of Value wrappers.
 * @returns The record with actual value types instead of Value wrappers.
 *
 * @internal
 */
type EventValue<T extends Record<Any, Value<Any, Any>>> = Prettify<{
  [K in keyof T]: T[K] extends Value<infer N, Any> ? N : T[K];
}>;

/**
 * Type for an event constructor function that creates typed events.
 * Extends the Traceable type to provide event-specific functionality.
 *
 * @typeParam K - The event key type.
 * @typeParam T - The event value type.
 *
 * @public
 */
type Event<K, T> = Component<
  'Event',
  EventData<K, T> & {
    (value: T): EventData<K, T>;
  }
>;

/**
 * Creates a typed event.
 *
 * @param def - The event definition containing key and value schema with Value wrappers.
 * @returns A typed event constructor function that accepts actual values.
 *
 * @public
 */
const event = <K extends string, V extends Record<string, Value<Any, Any>>>(
  def: Omit<EventData<K, V>, 'timestamp'>,
): Event<K, EventValue<V>> => {
  const constructor = (value: EventValue<V>) => ({
    key: def.key,
    value,
    timestamp: Date.now(),
  });

  constructor.key = def.key;

  return component('Event', constructor, def) as Event<K, EventValue<V>>;
};

/**
 * Panic error for the event module.
 * Used when an invalid event key is provided to the event store.
 *
 * @public
 */
class EventError extends Panic<'Event', 'InvalidKeyError'>('Event') {}

/**
 * Type-safe event store class that manages multiple event types.
 * Provides methods to add, retrieve, and manage events with full type safety.
 * Each event constructor must have a unique key.
 *
 * @typeParam R - The record type mapping event keys to their value types.
 *
 * @public
 */
class EventStore<R> {
  private readonly store: Any[] = [];
  private readonly eventMap: Map<string, Event<Any, Any>>;

  /**
   * The available event keys in the store.
   */
  public readonly keys: (keyof R)[];

  /**
   * Creates a new EventStore instance from a list of event constructors.
   *
   * @param events - The event constructors to include in the store (variadic parameters).
   */
  constructor(...events: Event<Any, Any>[]) {
    this.eventMap = new Map<string, Event<Any, Any>>();

    for (const ev of events) {
      this.eventMap.set(ev.key, ev);
    }

    this.keys = Array.from(this.eventMap.keys()) as (keyof R)[];
  }

  /**
   * Adds a typed event to the store.
   *
   * @param key - The event key (must be one of the keys in the union type R).
   * @param value - The event value (must match the type for the given key).
   */
  public add<K extends keyof R>(key: K, value: R[K]): void {
    const eventConstructor = this.eventMap.get(key as Any);

    if (!eventConstructor) {
      throw new EventError(
        'InvalidKeyError',
        `Event constructor not found for key: ${String(key)}`,
      );
    }

    this.store.push(eventConstructor(value));
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
 * Creates a type-safe event store from a list of event constructors.
 * The store provides full type safety for adding and retrieving events.
 * Each event constructor must have a unique key.
 *
 * @param events - The event constructors to include in the store (variadic parameters).
 * @returns A type-safe event store with methods to manage events.
 *
 * @public
 */
const events = <E extends Event<Any, Any>[]>(...events: E): EventStore<EventListToRecord<E>> =>
  new EventStore<EventListToRecord<E>>(...events);

export { EventError, event, events };
export type { Event, EventStore };
