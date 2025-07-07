/*
 * This file is part of the Daikit project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { Any } from './generics';
import { hash } from './hash';

/**
 * Represents a typed event with a key, value, hash, and timestamp.
 * This is the core data structure for all events in the system.
 *
 * @typeParam K - The event key (string literal type).
 * @typeParam T - The event value type.
 *
 * @example
 * ```ts
 * // Define a user created event type.
 * type UserCreated = Event<'user.created', { email: string; password: string }>;
 *
 * // The event will have this structure.
 * // {
 * //   _tag: 'Event';
 * //   _hash: string;
 * //   key: 'user.created';
 * //   value: { email: string; password: string };
 * //   timestamp: number;
 * // }
 * ```
 *
 * @public
 */
type Event<K extends string, T> = {
  _tag: 'Event';
  _hash: string;
  key: K;
  value: T;
  timestamp: number;
};

/**
 * Options for pulling events from the store.
 * Controls how events are sorted when retrieved.
 *
 * @example
 * ```ts
 * // Pull events sorted by oldest first (default).
 * const events = store.pull({ sort: 'asc' });
 *
 * // Pull events sorted by newest first.
 * const recentEvents = store.pull({ sort: 'desc' });
 * ```
 *
 * @internal
 */
type EventStorePullOptions = {
  /**
   * Sort order for events when pulling from the store.
   * - `'asc'`: Oldest events first (default).
   * - `'desc'`: Newest events first.
   */
  sort: 'asc' | 'desc';
};

/**
 * Interface for an event store that manages typed events.
 * Provides methods to add, retrieve, and manage events with full type safety.
 *
 * @typeParam T - Union type of all possible events in the store.
 *
 * @example
 * ```ts
 * // Define event types for type safety.
 * type UserCreated = Event<'user.created', { email: string; password: string }>;
 * type UserUpdated = Event<'user.updated', { id: string }>;
 * type UserDeleted = Event<'user.deleted', { id: string }>;
 *
 * // Create event store with explicit typing.
 * const store: EventStore<UserCreated | UserUpdated | UserDeleted> = eventStore();
 * ```
 *
 * @public
 */
interface EventStore<T extends Event<string, Any>> {
  /**
   * Adds an event to the store.
   *
   * @param key - The event key (must be one of the keys in the union type T).
   * @param value - The event value (must match the type for the given key).
   * @returns The created event object.
   *
   * @example
   * ```ts
   * // Add a user created event.
   * const userEvent = store.add('user.created', { email: 'test@example.com', password: '123456' });
   * // userEvent.key === 'user.created'.
   * // userEvent.value.email === 'test@example.com'.
   * ```
   */
  add: <K extends T['key']>(
    key: K,
    value: Extract<T, { key: K }>['value'],
  ) => Event<K, Extract<T, { key: K }>['value']>;

  /**
   * Retrieves an event from the store by its hash.
   *
   * @param hash - The hash of the event to retrieve.
   * @returns The event if found, undefined otherwise.
   *
   * @example
   * ```ts
   * // Retrieve an event by hash.
   * const event = store.get<'user.created'>(userEvent._hash);
   * if (event) {
   *   // event.value.email === 'test@example.com'.
   * }
   * ```
   */
  get: <K extends T['key']>(hash: string) => Extract<T, { key: K }> | undefined;

  /**
   * Retrieves and removes all events from the store.
   * Events are returned sorted by timestamp (oldest first by default).
   *
   * @param opts - Options for pulling events.
   * - `sort`: Sort order for events ('asc' for oldest first, 'desc' for newest first).
   *
   * @returns Array of all events that were in the store.
   *
   * @example
   * ```ts
   * // Pull all events (removes them from store).
   * const allEvents = store.pull();
   * // allEvents.length === Number of events that were in the store.
   * // store.list().length === 0 (store is now empty).
   * ```
   *
   * @example
   * ```ts
   * // Pull events sorted by newest first.
   * const recentEvents = store.pull({ sort: 'desc' });
   * // recentEvents[0].timestamp > recentEvents[1].timestamp.
   * ```
   */
  pull: (opts?: EventStorePullOptions) => T[];

  /**
   * Lists all events currently in the store without removing them.
   *
   * @returns Array of all events in the store.
   *
   * @example
   * ```ts
   * // List all events without removing them.
   * const events = store.list();
   * // events.length === Number of events currently in the store.
   * ```
   */
  list: () => T[];
}

/**
 * Creates a new event constructor for the given {@link Event} type.
 *
 * @remarks
 * This function is used by the {@link eventStore} to handle the creation of events. It is recommended
 * to use that API instead of this function, at least for the most common use cases. If you need
 * make other logic around the creation of events, this function is the way to go.
 *
 * @param key - The key of the event.
 * @returns A function that creates an event with the given key.
 *
 * @example
 * ```ts
 * // Define the event type.
 * type UserCreated = Event<'user.created', { email: string; password: string }>;
 *
 * // Create an event constructor for the event type.
 * const userEvent = event<UserCreated>('user.created');
 *
 * // Use the event constructor to create an event.
 * const userCreated = userEvent({ email: 'test@example.com', password: '123456' });
 * // userCreated.key === 'user.created'.
 * // userCreated.value.email === 'test@example.com'.
 * // userCreated.value.password === '123456'.
 * // userCreated._hash === '...'.
 * // userCreated.timestamp === ...
 * ```
 *
 * @public
 */
const event =
  <E extends Event<string, Any>>(key: E['key']) =>
  (value: E['value']) =>
    ({
      _tag: 'Event',
      _hash: hash(value),
      key,
      value,
      timestamp: Date.now(),
    }) as E;

/**
 * Creates an event store with automatic event function generation.
 * This allows for concise event store creation with perfect typing.
 *
 * @typeParam T - Union type of all possible events in the store.
 * @returns An event store with methods to add, retrieve, and manage events.
 *
 * @example
 * ```ts
 * // Basic usage with union types for maximum type safety.
 * type UserCreated = Event<'user.created', { email: string; password: string }>;
 * type UserUpdated = Event<'user.updated', { id: string }>;
 * type UserDeleted = Event<'user.deleted', { id: string }>;
 *
 * const store = eventStore<UserCreated | UserUpdated | UserDeleted>();
 * ```
 *
 * @example
 * ```ts
 * // Advanced usage with multiple event types.
 * type OrderPlaced = Event<'order.placed', { orderId: string; amount: number }>;
 * type OrderShipped = Event<'order.shipped', { orderId: string; trackingNumber: string }>;
 * type OrderDelivered = Event<'order.delivered', { orderId: string; deliveredAt: Date }>;
 *
 * const orderStore = eventStore<OrderPlaced | OrderShipped | OrderDelivered>();
 * ```
 *
 * @public
 */
const eventStore = <T extends Event<string, Any>>(): EventStore<T> => {
  const store: T[] = [];

  return {
    add: (key, value) => {
      const e = event(key)(value) as Extract<T, { key: typeof key }>;
      store.push(e);
      return e;
    },
    get: <K extends T['key']>(hash: string) =>
      store.find((event) => event._hash === hash) as Extract<T, { key: K }> | undefined,
    pull: (opts: EventStorePullOptions = { sort: 'asc' }) => {
      const list = store.slice().sort((a, b) => {
        if (opts.sort === 'asc') {
          return a.timestamp - b.timestamp;
        }
        return b.timestamp - a.timestamp;
      });
      store.splice(0);
      return list;
    },
    list: () => store.map((event) => event),
  };
};

export type { Event, EventStore };
export { event, eventStore };
