/*
 * This file is part of the Mixor project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { type Element, element } from './element';
import type { Any, Prettify } from './generics';
import { hash } from './hash';
import { Panic } from './panic';
import type { Value } from './value';

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
 * Type for an event constructor function that creates typed events.
 * Extends the Element type to provide event-specific functionality.
 *
 * @typeParam K - The event key type.
 * @typeParam T - The event value type.
 *
 * @internal
 */
type Event<K, T> = Element<
  'Event',
  EventData<K, T> & {
    (value: T): EventData<K, T>;
  }
>;

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
 * Creates a typed event constructor with documentation and validation.
 * The function takes a record of Value wrappers and returns an event constructor
 * that accepts the actual value types (extracted from the Value wrappers).
 *
 * @param doc - The documentation string describing the event.
 * @param def - The event definition containing key and value schema with Value wrappers.
 * @returns A typed event constructor function that accepts actual values.
 *
 * @example
 * ```ts
 * // event-001: Basic event creation with Value types for validation.
 * const userCreated = event('User created event', {
 *   key: 'user.created',
 *   value: {
 *     id: value('id', (id: string) => ok(id)),
 *     name: value('name', (name: string) => ok(name))
 *   }
 * });
 * const eventData = userCreated({ id: '123', name: 'John' });
 * // eventData: { key: 'user.created', value: { id: '123', name: 'John' }, timestamp: number }
 * ```
 *
 * @example
 * ```ts
 * // event-002: Event creation with complex Value schema for validation.
 * const userUpdated = event('User updated event', {
 *   key: 'user.updated',
 *   value: {
 *     id: value('id', (id: string) => ok(id)),
 *     name: value('name', (name: string) => ok(name)),
 *     email: value('email', (email: string) => ok(email)),
 *     age: value('age', (age: number) => ok(age))
 *   }
 * });
 * const eventData = userUpdated({
 *   id: '123',
 *   name: 'John',
 *   email: 'john@example.com',
 *   age: 30
 * });
 * // eventData: typed event with timestamp
 * ```
 *
 * @public
 */
const event = <K extends string, V extends Record<string, Value<Any, Any>>>(
  doc: string,
  def: Omit<EventData<K, V>, 'timestamp'>,
): Event<K, EventValue<V>> => {
  const constructor = (value: EventValue<V>) => ({
    key: def.key,
    value,
    timestamp: Date.now(),
  });

  constructor.key = def.key;

  return element(constructor, {
    tag: 'Event',
    hash: hash(constructor),
    doc,
  }) as Event<K, EventValue<V>>;
};

/**
 * Interface for a type-safe event store that manages multiple event types.
 * Provides methods to add, retrieve, and manage events with full type safety.
 *
 * @typeParam R - The record type mapping event keys to their value types.
 *
 * @public
 */
interface EventStore<R> {
  /**
   * The available event keys in the store.
   *
   * @returns Array of event keys.
   *
   * @public
   */
  keys: (keyof R)[];

  /**
   * Adds a typed event to the store.
   *
   * @param key - The event key (must be one of the keys in the union type R).
   * @param value - The event value (must match the type for the given key).
   *
   * @public
   */
  add: <K extends keyof R>(key: K, value: R[K]) => void;

  /**
   * Retrieves and removes all events from the store.
   * Events are returned sorted by timestamp (oldest first by default).
   *
   * @param sort - Sort order for events ('asc' for oldest first, 'desc' for newest first).
   * @returns Array of all events that were in the store.
   *
   * @public
   */
  pull: (sort?: 'asc' | 'desc') => Event<keyof R, R[keyof R]>[];

  /**
   * Lists all events currently in the store without removing them.
   *
   * @returns Array of all events in the store.
   *
   * @public
   */
  list: (sort?: 'asc' | 'desc') => Event<keyof R, R[keyof R]>[];
}

/**
 * Panic error for the event module.
 * Used when an invalid event key is provided to the event store.
 *
 * @example
 * ```ts
 * // Handling EventError in event store operations.
 * const store = events([userCreated]);
 *
 * try {
 *   store.add('invalid.key', { id: '123', name: 'John' });
 * } catch (error) {
 *   if (error instanceof EventError) {
 *     console.log('EventError:', error.key); // "EVENT:INVALID_KEY"
 *     console.log('Message:', error.message); // "Event constructor not found for key: invalid.key"
 *   }
 * }
 * ```
 *
 * @public
 */
const EventError = Panic<'EVENT', 'INVALID_KEY'>('EVENT');

/**
 * Creates a type-safe event store from a list of event constructors.
 * The store provides full type safety for adding and retrieving events.
 * Each event constructor in the array must have a unique key.
 *
 * @param events - The array of event constructors to include in the store.
 * @returns A type-safe event store with methods to manage events.
 *
 * @example
 * ```ts
 * // event-003: Creating an event store with multiple event types.
 * const userCreated = event('User created', {
 *   key: 'user.created',
 *   value: {
 *     id: value('id', (id: string) => ok(id)),
 *     name: value('name', (name: string) => ok(name))
 *   }
 * });
 *
 * const userUpdated = event('User updated', {
 *   key: 'user.updated',
 *   value: {
 *     id: value('id', (id: string) => ok(id)),
 *     name: value('name', (name: string) => ok(name)),
 *     email: value('email', (email: string) => ok(email))
 *   }
 * });
 *
 * const eventStore = events([userCreated, userUpdated]);
 * // eventStore: EventStore with type-safe add, pull, and list methods
 * ```
 *
 * @example
 * ```ts
 * // event-004: Using the event store to add and retrieve events.
 * const store = events([userCreated, userUpdated]);
 *
 * // Add events with type safety
 * store.add('user.created', { id: '123', name: 'John' });
 * store.add('user.updated', {
 *   id: '123',
 *   name: 'John',
 *   email: 'john@example.com'
 * });
 *
 * // List all events
 * const allEvents = store.list();
 * // allEvents: Array of events with timestamps
 *
 * // Pull events (removes from store)
 * const pulledEvents = store.pull('asc');
 * // pulledEvents: Array of events sorted by timestamp
 * ```
 *
 * @example
 * ```ts
 * // event-005: Error handling when adding events with invalid keys.
 * const store = events([userCreated]);
 *
 * try {
 *   store.add('invalid.key', { id: '123', name: 'John' });
 * } catch (error) {
 *   if (error instanceof EventError) {
 *     console.log('EventError caught:', error.key, error.message);
 *     // Output: "EVENT:INVALID_KEY Event constructor not found for key: invalid.key"
 *   }
 * }
 * ```
 *
 * @public
 */
const events = <E extends Event<Any, Any>[], R = EventListToRecord<E>>(
  events: E,
): EventStore<R> => {
  const store: Any[] = [];
  const eventMap = new Map<string, Event<Any, Any>>();

  for (const key in events) {
    const ev = events[key];
    eventMap.set(ev.key, ev);
  }

  const sortStore = (sort: 'asc' | 'desc') =>
    store
      .slice()
      .sort((a, b) => (sort === 'asc' ? a.timestamp - b.timestamp : b.timestamp - a.timestamp));

  return {
    keys: Array.from(eventMap.keys()) as (keyof R)[],
    add: (key, value) => {
      const eventConstructor = eventMap.get(key as Any);

      if (!eventConstructor) {
        throw new EventError('INVALID_KEY', `Event constructor not found for key: ${String(key)}`);
      }

      store.push(eventConstructor(value));
    },
    pull: (sort: 'asc' | 'desc' = 'asc') => {
      const list = sortStore(sort);
      store.splice(0);
      return list;
    },
    list: (sort: 'asc' | 'desc' = 'asc') => sortStore(sort),
  };
};

export type { Event, EventStore };
export { event, events, EventError };
