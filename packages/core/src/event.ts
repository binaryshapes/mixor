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
 * Represents a typed event with a key, value, hash, timestamp, and optional documentation.
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
 * //   _doc?: string; // Optional documentation
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
  _doc?: string;
};

/**
 * Type for an event constructor function that creates events.
 * This can be either a simple event constructor or a documented one.
 *
 * @typeParam E - The event type.
 *
 * @example
 * ```ts
 * // Simple event constructor
 * const userCreated = event<UserCreated>('user.created');
 *
 * // Documented event constructor
 * const userCreated = event<UserCreated>(
 *   doc`This event is emitted when a user is created.`,
 *   'user.created'
 * );
 * ```
 *
 * @public
 */
type EventConstructor<E extends Event<string, Any>> = (value: E['value']) => E;

/**
 * Type for a list of event constructors indexed by their keys.
 * This allows for type-safe event store creation with documented events.
 *
 * @typeParam T - Union type of all possible events.
 *
 * @example
 * ```ts
 * const events: EventList<UserCreated | UserUpdated | UserDeleted> = {
 *   'user.created': event<UserCreated>(
 *     doc`This event is emitted when a user is created.`,
 *     'user.created'
 *   ),
 *   'user.updated': event<UserUpdated>(
 *     doc`This event is emitted when a user is updated.`,
 *     'user.updated'
 *   ),
 * };
 * ```
 *
 * @public
 */
type EventList<T extends Event<string, Any>> = {
  [K in T['key']]: EventConstructor<Extract<T, { key: K }>>;
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
   * // event-003: Add a user created event.
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
   * // event-004: Retrieve an event by hash.
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
   * // event-005: Pull all events (removes them from store).
   * const allEvents = store.pull();
   * // allEvents.length === Number of events that were in the store.
   * // store.list().length === 0 (store is now empty).
   * ```
   *
   * @example
   * ```ts
   * // event-006: Pull events sorted by newest first.
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
   * // event-007: List all events without removing them.
   * const events = store.list();
   * // events.length === Number of events currently in the store.
   * ```
   */
  list: () => T[];
}

/**
 * Interface for the event constructor function with overloads.
 * This allows for different function signatures based on whether documentation is provided.
 *
 * @internal
 */
interface EventFunction {
  /**
   * Creates a new event constructor without documentation.
   *
   * @typeParam E - The event type.
   * @param key - The key of the event.
   * @returns A function that creates an event with the given key.
   */
  <E extends Event<string, Any>>(key: E['key']): EventConstructor<E>;

  /**
   * Creates a new event constructor with documentation.
   *
   * @typeParam E - The event type.
   * @param documentation - The documentation string for the event.
   * @param key - The key of the event.
   * @returns A function that creates a documented event with the given key.
   */
  <E extends Event<string, Any>>(documentation: string, key: E['key']): EventConstructor<E>;
}

/**
 * Creates a new event constructor for the given {@link Event} type.
 * This function supports both documented and non-documented events through function overloads.
 *
 * @remarks
 * This function is used by the {@link eventStore} to handle the creation of events. It is recommended
 * to use that API instead of this function, at least for the most common use cases. If you need
 * make other logic around the creation of events, this function is the way to go.
 *
 * @param documentationOrKey - The documentation string or key of the event.
 * @param key - The key of the event. If not provided, the documentationOrKey is used as the key.
 * @returns A function that creates an event with the given key.
 *
 * @example
 * ```ts
 * // event-001: Basic event constructor without documentation.
 * // Define the event type.
 * type UserCreated = Event<'user.created', { email: string; password: string }>;
 *
 * // Create an event constructor without documentation.
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
 * @example
 * ```ts
 * // event-002: Event constructor with documentation.
 * // Create an event constructor with documentation.
 * const userEvent = event<UserCreated>(
 *   'This event is emitted when a user is created.',
 *   'user.created'
 * );
 *
 * // Use the documented event constructor to create an event.
 * const userCreated = userEvent({ email: 'test@example.com', password: '123456' });
 * // userCreated.key === 'user.created'.
 * // userCreated.value.email === 'test@example.com'.
 * // userCreated._doc === 'This event is emitted when a user is created.'
 * ```
 *
 * @public
 */
const event: EventFunction =
  <E extends Event<string, Any>>(documentationOrKey: string, key?: E['key']): EventConstructor<E> =>
  (value: E['value']) =>
    ({
      _tag: 'Event',
      _hash: hash(value),
      // If two arguments are provided, first is documentation, second is key.
      _doc: !key ? undefined : documentationOrKey,
      // If only one argument is provided, it's the key (no documentation).
      key: key ? key : (documentationOrKey as E['key']),
      value,
      timestamp: Date.now(),
    }) as E;

/**
 * Interface for the event store factory function with overloads.
 * This allows for different function signatures based on the input type.
 *
 * @internal
 */
interface EventStoreFunction {
  /**
   * Creates an event store with union type specification.
   *
   * @typeParam T - Union type of all possible events in the store.
   * @returns An event store with methods to add, retrieve, and manage events.
   */
  <T extends Event<string, Any>>(): EventStore<T>;

  /**
   * Creates an event store with event list specification.
   * TypeScript will automatically infer the event types from the EventList.
   *
   * @param eventList - Object containing event constructors indexed by their keys.
   * @returns An event store with methods to add, retrieve, and manage events.
   */
  <T extends Record<string, EventConstructor<Any>>>(
    eventList: T,
  ): EventStore<ReturnType<T[keyof T]>>;
}

/**
 * Creates an event store with automatic event function generation.
 * This allows for concise event store creation with perfect typing.
 * Supports both union type specification and event list specification.
 *
 * @typeParam T - Union type of all possible events in the store.
 * @param eventList - Optional object containing event constructors indexed by their keys.
 * @returns An event store with methods to add, retrieve, and manage events.
 *
 * @example
 * ```ts
 * // event-008: Basic usage with union types for maximum type safety.
 * type UserCreated = Event<'user.created', { email: string; password: string }>;
 * type UserUpdated = Event<'user.updated', { id: string }>;
 * type UserDeleted = Event<'user.deleted', { id: string }>;
 *
 * const store = eventStore<UserCreated | UserUpdated | UserDeleted>();
 * ```
 *
 * @example
 * ```ts
 * // event-009: Advanced usage with multiple event types.
 * type OrderPlaced = Event<'order.placed', { orderId: string; amount: number }>;
 * type OrderShipped = Event<'order.shipped', { orderId: string; trackingNumber: string }>;
 * type OrderDelivered = Event<'order.delivered', { orderId: string; deliveredAt: Date }>;
 *
 * const orderStore = eventStore<OrderPlaced | OrderShipped | OrderDelivered>();
 * ```
 *
 * @example
 * ```ts
 * // event-010: Usage with documented events using EventList (type inference).
 * type UserCreated = Event<'user.created', { email: string; password: string }>;
 * type UserUpdated = Event<'user.updated', { id: string }>;
 * type UserDeleted = Event<'user.deleted', { id: string }>;
 *
 * const events = {
 *   'user.created': event<UserCreated>(
 *     'This event is emitted when a user is created.',
 *     'user.created'
 *   ),
 *   'user.updated': event<UserUpdated>(
 *     'This event is emitted when a user is updated.',
 *     'user.updated'
 *   ),
 *   'user.deleted': event<UserDeleted>(
 *     'This event is emitted when a user is deleted.',
 *     'user.deleted'
 *   ),
 * };
 *
 * // TypeScript automatically infers the event types from the EventList.
 * const store = eventStore(events);
 * ```
 *
 * @public
 */
const eventStore: EventStoreFunction = <
  T extends Event<string, Any> | Record<string, EventConstructor<Any>>,
>(
  eventList?: T extends Record<string, EventConstructor<Any>> ? T : never,
): EventStore<T extends Record<string, EventConstructor<Any>> ? ReturnType<T[keyof T]> : T> => {
  const store: Any[] = [];

  return {
    add: (key, value) => {
      // If eventList is provided, use the corresponding event constructor.
      if (eventList && key in eventList) {
        const eventConstructor = eventList[key];
        const e = eventConstructor(value);
        store.push(e);
        return e;
      }

      // Fallback to the original event creation logic.
      const e = event(key)(value);
      store.push(e);
      return e;
    },
    get: (hash: string) => store.find((event) => event._hash === hash),
    pull: (opts: EventStorePullOptions = { sort: 'asc' }) => {
      const list = store
        .slice()
        .sort((a, b) =>
          opts.sort === 'asc' ? a.timestamp - b.timestamp : b.timestamp - a.timestamp,
        );
      store.splice(0);
      return list;
    },
    list: () => store.map((event) => event),
  };
};

export type { Event, EventStore, EventConstructor, EventList };
export { event, eventStore };
