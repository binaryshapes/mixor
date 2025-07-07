import { setTimeout as sleep } from 'node:timers/promises';
import { beforeEach, describe, expect, expectTypeOf, it } from 'vitest';

import { type Event, type EventStore, event, eventStore } from '../src/event';

describe('EventStore', () => {
  // Define test event types.
  type UserCreated = Event<'user.created', { email: string; password: string }>;
  type UserUpdated = Event<'user.updated', { id: string }>;
  type UserDeleted = Event<'user.deleted', { id: string }>;
  type OrderPlaced = Event<'order.placed', { orderId: string; amount: number }>;
  type OrderShipped = Event<'order.shipped', { orderId: string; trackingNumber: string }>;
  type OrderDelivered = Event<'order.delivered', { orderId: string; deliveredAt: Date }>;

  let store: EventStore<UserCreated | UserUpdated | UserDeleted>;

  beforeEach(() => {
    store = eventStore<UserCreated | UserUpdated | UserDeleted>();
  });

  describe('Type definitions', () => {
    it('should handle Event type example from documentation', () => {
      // Create an event using the event constructor.
      const userEvent = event<UserCreated>('user.created');
      const createdEvent = userEvent({
        email: 'test@example.com',
        password: '123456',
      });

      // Verify the event structure.
      expect(createdEvent._tag).toBe('Event');
      expect(createdEvent.key).toBe('user.created');
      expect(createdEvent.value.email).toBe('test@example.com');
      expect(createdEvent.value.password).toBe('123456');
      expect(createdEvent._hash).toBeTypeOf('string');
      expect(createdEvent.timestamp).toBeTypeOf('number');

      // Typechecking.
      expectTypeOf(userEvent).toEqualTypeOf<(value: UserCreated['value']) => UserCreated>();
      expectTypeOf(createdEvent).toEqualTypeOf<UserCreated>();
    });

    it('should handle event function example from documentation', () => {
      // Define the event type.
      type UserCreated = Event<'user.created', { email: string; password: string }>;

      // Create an event constructor for the event type.
      const userEvent = event<UserCreated>('user.created');

      // Use the event constructor to create an event.
      const userCreated = userEvent({ email: 'test@example.com', password: '123456' });

      // Verify the event structure matches documentation.
      expect(userCreated.key).toBe('user.created');
      expect(userCreated.value.email).toBe('test@example.com');
      expect(userCreated.value.password).toBe('123456');
      expect(userCreated._hash).toBeTypeOf('string');
      expect(userCreated.timestamp).toBeTypeOf('number');

      // Typechecking.
      expectTypeOf(userEvent).toEqualTypeOf<(value: UserCreated['value']) => UserCreated>();
      expectTypeOf(userCreated).toEqualTypeOf<UserCreated>();
    });

    it('should handle EventStorePullOptions type example from documentation', async () => {
      // Add some events to test sorting.
      store.add('user.created', { email: 'test1@example.com', password: '123456' });
      await sleep(10);
      store.add('user.created', { email: 'test2@example.com', password: '123456' });

      // Pull events sorted by oldest first (default).
      const events = store.pull({ sort: 'asc' });
      expect(events[0].timestamp).toBeLessThan(events[1].timestamp);

      // Add events again for descending test.
      store.add('user.created', { email: 'test3@example.com', password: '123456' });
      await sleep(10);
      store.add('user.created', { email: 'test4@example.com', password: '123456' });

      // Pull events sorted by newest first.
      const recentEvents = store.pull({ sort: 'desc' });
      expect(recentEvents[0].timestamp).toBeGreaterThan(recentEvents[1].timestamp);
    });
  });

  describe('Basic functionality', () => {
    it('should handle basic usage example from documentation', () => {
      // Create event store with explicit typing.
      const store: EventStore<UserCreated | UserUpdated | UserDeleted> = eventStore();

      // Typechecking.
      expectTypeOf(store).toEqualTypeOf<EventStore<UserCreated | UserUpdated | UserDeleted>>();
      expectTypeOf(store.add).toBeFunction();
      expectTypeOf(store.get).toBeFunction();
      expectTypeOf(store.pull).toBeFunction();
      expectTypeOf(store.list).toBeFunction();
    });

    it('should handle advanced usage example from documentation', () => {
      const orderStore = eventStore<OrderPlaced | OrderShipped | OrderDelivered>();

      // Typechecking.
      expectTypeOf(orderStore).toEqualTypeOf<
        EventStore<OrderPlaced | OrderShipped | OrderDelivered>
      >();
    });
  });

  describe('add method', () => {
    it('should handle add method example from documentation', () => {
      // Add a user created event.
      const userEvent = store.add('user.created', {
        email: 'test@example.com',
        password: '123456',
      });

      expect(userEvent.key).toBe('user.created');
      expect(userEvent.value.email).toBe('test@example.com');

      // Typechecking.
      expectTypeOf(userEvent).toEqualTypeOf<UserCreated>();
      expectTypeOf(userEvent.key).toBeString();
      expectTypeOf(userEvent.value).toEqualTypeOf<{ email: string; password: string }>();
    });

    it('should add different event types correctly', () => {
      const createdEvent = store.add('user.created', {
        email: 'test@example.com',
        password: '123456',
      });
      const updatedEvent = store.add('user.updated', { id: '123' });
      const deletedEvent = store.add('user.deleted', { id: '456' });

      expect(createdEvent.key).toBe('user.created');
      expect(updatedEvent.key).toBe('user.updated');
      expect(deletedEvent.key).toBe('user.deleted');

      // Typechecking.
      expectTypeOf(createdEvent).toEqualTypeOf<UserCreated>();
      expectTypeOf(updatedEvent).toEqualTypeOf<UserUpdated>();
      expectTypeOf(deletedEvent).toEqualTypeOf<UserDeleted>();
    });

    it('should generate unique hashes for different events', () => {
      const event1 = store.add('user.created', { email: 'test1@example.com', password: '123456' });
      const event2 = store.add('user.created', { email: 'test2@example.com', password: '123456' });

      expect(event1._hash).not.toBe(event2._hash);
      expect(event1._hash).toBeTypeOf('string');
      expect(event2._hash).toBeTypeOf('string');
    });

    it('should include timestamp in events', () => {
      const before = Date.now();
      const event = store.add('user.created', { email: 'test@example.com', password: '123456' });
      const after = Date.now();

      expect(event.timestamp).toBeGreaterThanOrEqual(before);
      expect(event.timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('get method', () => {
    it('should handle get method example from documentation', () => {
      // Add a user created event.
      const userEvent = store.add('user.created', {
        email: 'test@example.com',
        password: '123456',
      });

      // Retrieve an event by hash.
      const event = store.get<'user.created'>(userEvent._hash);

      expect(event).toBeDefined();
      if (event) {
        expect(event.value.email).toBe('test@example.com');
      }

      // Typechecking.
      expectTypeOf(event).toEqualTypeOf<UserCreated | undefined>();
    });

    it('should return undefined for non-existent hash', () => {
      const event = store.get<'user.created'>('non-existent-hash');
      expect(event).toBeUndefined();
    });

    it('should retrieve events by hash correctly', () => {
      const createdEvent = store.add('user.created', {
        email: 'test@example.com',
        password: '123456',
      });
      const updatedEvent = store.add('user.updated', { id: '123' });

      const retrievedCreated = store.get<'user.created'>(createdEvent._hash);
      const retrievedUpdated = store.get<'user.updated'>(updatedEvent._hash);

      expect(retrievedCreated).toEqual(createdEvent);
      expect(retrievedUpdated).toEqual(updatedEvent);
    });
  });

  describe('pull method', () => {
    it('should handle pull method example from documentation', () => {
      // Add some events.
      store.add('user.created', { email: 'test@example.com', password: '123456' });
      store.add('user.updated', { id: '123' });

      // Pull all events (removes them from store).
      const allEvents = store.pull();

      expect(allEvents.length).toBe(2);
      expect(store.list().length).toBe(0); // Store is now empty.

      // Typechecking.
      expectTypeOf(allEvents).toEqualTypeOf<(UserCreated | UserUpdated | UserDeleted)[]>();
    });

    it('should handle pull with sort options example from documentation', async () => {
      // Add events with delays to ensure different timestamps.
      store.add('user.created', { email: 'test1@example.com', password: '123456' });
      await sleep(10);
      store.add('user.created', { email: 'test2@example.com', password: '123456' });

      // Pull events sorted by newest first.
      const recentEvents = store.pull({ sort: 'desc' });

      expect(recentEvents[0].timestamp > recentEvents[1].timestamp).toBe(true);

      // Typechecking.
      expectTypeOf(recentEvents).toEqualTypeOf<(UserCreated | UserUpdated | UserDeleted)[]>();
    });

    it('should sort events by timestamp correctly', async () => {
      store.add('user.created', { email: 'test1@example.com', password: '123456' });
      await sleep(10);
      store.add('user.created', { email: 'test2@example.com', password: '123456' });

      // Test ascending sort (oldest first).
      const ascEvents = store.pull({ sort: 'asc' });
      expect(ascEvents[0].timestamp).toBeLessThan(ascEvents[1].timestamp);

      // Add events again for descending test.
      store.add('user.created', { email: 'test3@example.com', password: '123456' });
      await sleep(10);
      store.add('user.created', { email: 'test4@example.com', password: '123456' });

      // Test descending sort (newest first).
      const descEvents = store.pull({ sort: 'desc' });
      expect(descEvents[0].timestamp).toBeGreaterThan(descEvents[1].timestamp);
    });

    it('should remove all events from store when pulled', () => {
      store.add('user.created', { email: 'test@example.com', password: '123456' });
      store.add('user.updated', { id: '123' });

      expect(store.list().length).toBe(2);

      const pulledEvents = store.pull();
      expect(pulledEvents.length).toBe(2);
      expect(store.list().length).toBe(0);
    });
  });

  describe('list method', () => {
    it('should handle list method example from documentation', () => {
      // Add some events.
      store.add('user.created', { email: 'test@example.com', password: '123456' });
      store.add('user.updated', { id: '123' });

      // List all events without removing them.
      const events = store.list();

      expect(events.length).toBe(2); // Number of events currently in the store.

      // Typechecking.
      expectTypeOf(events).toEqualTypeOf<(UserCreated | UserUpdated | UserDeleted)[]>();
    });

    it('should return empty array when store is empty', () => {
      const events = store.list();
      expect(events).toEqual([]);
    });

    it('should not remove events when listing', () => {
      store.add('user.created', { email: 'test@example.com', password: '123456' });

      const events1 = store.list();
      expect(events1.length).toBe(1);

      const events2 = store.list();
      expect(events2.length).toBe(1);
      expect(events2).toEqual(events1);
    });
  });

  describe('Code examples', () => {
    it('should handle basic usage example from documentation', () => {
      // Create event store with explicit typing.
      const store: EventStore<UserCreated | UserUpdated | UserDeleted> = eventStore();

      // Add events.
      const userEvent = store.add('user.created', {
        email: 'test@example.com',
        password: '123456',
      });
      store.add('user.updated', { id: '123' });
      store.add('user.deleted', { id: '456' });

      // Verify events were added.
      expect(store.list().length).toBe(3);
      expect(userEvent.key).toBe('user.created');
      expect(userEvent.value.email).toBe('test@example.com');

      // Retrieve event.
      const retrievedEvent = store.get<'user.created'>(userEvent._hash);
      expect(retrievedEvent).toEqual(userEvent);

      // Pull all events.
      const allEvents = store.pull();
      expect(allEvents.length).toBe(3);
      expect(store.list().length).toBe(0);
    });

    it('should handle advanced usage example from documentation', () => {
      const orderStore = eventStore<OrderPlaced | OrderShipped | OrderDelivered>();

      // Add different types of events.
      const placedEvent = orderStore.add('order.placed', { orderId: '123', amount: 99.99 });
      const shippedEvent = orderStore.add('order.shipped', {
        orderId: '123',
        trackingNumber: 'TRK123',
      });
      const deliveredEvent = orderStore.add('order.delivered', {
        orderId: '123',
        deliveredAt: new Date(),
      });

      // Verify events.
      expect(placedEvent.key).toBe('order.placed');
      expect(shippedEvent.key).toBe('order.shipped');
      expect(deliveredEvent.key).toBe('order.delivered');

      // Verify store contents.
      expect(orderStore.list().length).toBe(3);

      // Pull events with sorting.
      const events = orderStore.pull({ sort: 'desc' });
      expect(events.length).toBe(3);
      expect(orderStore.list().length).toBe(0);
    });
  });

  describe('Type safety', () => {
    it('should enforce correct value types for each event key', () => {
      // This should compile without errors.
      store.add('user.created', { email: 'test@example.com', password: '123456' });
      store.add('user.updated', { id: '123' });
      store.add('user.deleted', { id: '456' });

      // Typechecking.
      expectTypeOf(store.add)
        .parameter(0)
        .toEqualTypeOf<'user.created' | 'user.updated' | 'user.deleted'>();
    });

    it('should provide correct return types for get method', () => {
      const createdEvent = store.add('user.created', {
        email: 'test@example.com',
        password: '123456',
      });

      const retrievedEvent = store.get<'user.created'>(createdEvent._hash);

      // Typechecking.
      expectTypeOf(retrievedEvent).toEqualTypeOf<UserCreated | undefined>();
      if (retrievedEvent) {
        expectTypeOf(retrievedEvent.value).toEqualTypeOf<{ email: string; password: string }>();
      }
    });
  });
});
