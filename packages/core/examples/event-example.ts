import { EventError, event, events } from '../src/event';
import { ok } from '../src/result';
import { value } from '../src/value';

/**
 * event-001: Basic event creation with Value types for validation.
 */
function eventBasicCreation() {
  console.log('\nevent-001: Basic event creation with Value types for validation.');
  const userCreated = event('User created event', {
    key: 'user.created',
    value: {
      id: value('id', (id: string) => ok(id)),
      name: value('name', (name: string) => ok(name)),
    },
  });

  // Create an event with the actual values
  const eventData = userCreated({ id: '123', name: 'John' });
  // eventData: { key: 'user.created', value: { id: '123', name: 'John' }, timestamp: number }

  // Demonstrate accessing event properties
  console.log('Event key:', eventData.key);
  console.log('Event value:', eventData.value);
  console.log('Event timestamp:', eventData.timestamp);
}

/**
 * event-002: Event creation with complex Value schema for validation.
 */
function eventComplexCreation() {
  console.log('\nevent-002: Event creation with complex Value schema for validation.');
  const userUpdated = event('User updated event', {
    key: 'user.updated',
    value: {
      id: value('id', (id: string) => ok(id)),
      name: value('name', (name: string) => ok(name)),
      email: value('email', (email: string) => ok(email)),
      age: value('age', (age: number) => ok(age)),
    },
  });

  // Create an event with complex data
  const eventData = userUpdated({
    id: '123',
    name: 'John',
    email: 'john@example.com',
    age: 30,
  });

  // Demonstrate the event structure
  console.log('Complex event created:', eventData);
}

/**
 * event-003: Creating an event store with multiple event types.
 */
function eventStoreCreation() {
  console.log('\nevent-003: Creating an event store with multiple event types.');
  const userCreated = event('User created', {
    key: 'user.created',
    value: {
      id: value('id', (id: string) => ok(id)),
      name: value('name', (name: string) => ok(name)),
    },
  });

  const userUpdated = event('User updated', {
    key: 'user.updated',
    value: {
      id: value('id', (id: string) => ok(id)),
      name: value('name', (name: string) => ok(name)),
      email: value('email', (email: string) => ok(email)),
    },
  });

  // Create event store with multiple event types
  const eventStore = events([userCreated, userUpdated]);

  // Demonstrate available keys
  console.log('Available event keys:', eventStore.keys);
}

/**
 * event-004: Using the event store to add and retrieve events.
 */
function eventStoreUsage() {
  console.log('\nevent-004: Using the event store to add and retrieve events.');
  const userCreated = event('User created', {
    key: 'user.created',
    value: {
      id: value('id', (id: string) => ok(id)),
      name: value('name', (name: string) => ok(name)),
    },
  });

  const userUpdated = event('User updated', {
    key: 'user.updated',
    value: {
      id: value('id', (id: string) => ok(id)),
      name: value('name', (name: string) => ok(name)),
      email: value('email', (email: string) => ok(email)),
    },
  });

  const store = events([userCreated, userUpdated]);

  // Add events with type safety
  store.add('user.created', { id: '123', name: 'John' });
  store.add('user.updated', {
    id: '123',
    name: 'John',
    email: 'john@example.com',
  });

  // List all events
  const allEvents = store.list();
  console.log('All events in store:', allEvents.length);

  // Pull events (removes from store)
  const pulledEvents = store.pull('asc');
  console.log('Pulled events:', pulledEvents.length);

  // Store is now empty
  const remainingEvents = store.list();
  console.log('Remaining events:', remainingEvents.length);
}

/**
 * event-005: Error handling when adding events with invalid keys.
 */
function eventStoreErrorHandling() {
  console.log('\nevent-005: Error handling when adding events with invalid keys.');
  const userCreated = event('User created', {
    key: 'user.created',
    value: {
      id: value('id', (id: string) => ok(id)),
      name: value('name', (name: string) => ok(name)),
    },
  });

  const store = events([userCreated]);

  try {
    // @ts-expect-error - invalid key
    store.add('invalid.key', { id: '123', name: 'John' });
  } catch (error) {
    // Check if it's an EventError
    if (error instanceof EventError) {
      console.log('EventError caught:', error.key, error.message);
    } else {
      console.log('Unexpected error:', error instanceof Error ? error.message : String(error));
    }
    // error: EventError with code 'INVALID_KEY' and message about invalid key
  }
}

eventBasicCreation();
eventComplexCreation();
eventStoreCreation();
eventStoreUsage();
eventStoreErrorHandling();
