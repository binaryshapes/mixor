import { setTimeout } from 'node:timers/promises';
import type { Any } from 'src/generics';
import { describe, expect, expectTypeOf, it } from 'vitest';

import { EventError, event, events } from '../src/event';
import { ok } from '../src/result';
import { type Value, rule, value } from '../src/value';

describe('Event', () => {
  describe('Basic functionality', () => {
    it('should create an event constructor', () => {
      const userCreated = event({
        key: 'user.created',
        value: {
          id: value(rule((id: string) => ok(id))),
          name: value(rule((name: string) => ok(name))),
        },
      });

      expect(userCreated).toBeDefined();
      expect(userCreated.key).toBe('user.created');
      expect(typeof userCreated).toBe('function');
    });

    it('should create an event with timestamp', async () => {
      const userCreated = event({
        key: 'user.created',
        value: {
          id: value(rule((id: string) => ok(id))),
          name: value(rule((name: string) => ok(name))),
        },
      });

      const before = Date.now();
      await setTimeout(20);
      const eventData = userCreated({ id: '123', name: 'John' });
      await setTimeout(20);
      const after = Date.now();

      expect(eventData.key).toBe('user.created');
      expect(eventData.value).toEqual({ id: '123', name: 'John' });
      expect(eventData.timestamp).toBeGreaterThanOrEqual(before);
      expect(eventData.timestamp).toBeLessThanOrEqual(after);
    });

    it('should create events with complex value schemas', () => {
      const userUpdated = event({
        key: 'user.updated',
        value: {
          id: value(rule((id: string) => ok(id))),
          name: value(rule((name: string) => ok(name))),
          email: value(rule((email: string) => ok(email))),
          age: value(rule((age: number) => ok(age))),
        },
      });

      const eventData = userUpdated({
        id: '123',
        name: 'John',
        email: 'john@example.com',
        age: 30,
      });

      expect(eventData.key).toBe('user.updated');
      expect(eventData.value).toEqual({
        id: '123',
        name: 'John',
        email: 'john@example.com',
        age: 30,
      });
    });
  });

  describe('Event store functionality', () => {
    it('should create an event store with multiple events', () => {
      const userCreated = event({
        key: 'user.created',
        value: {
          id: value(rule((id: string) => ok(id))),
          name: value(rule((name: string) => ok(name))),
        },
      });

      const userUpdated = event({
        key: 'user.updated',
        value: {
          id: value(rule((id: string) => ok(id))),
          name: value(rule((name: string) => ok(name))),
          email: value(rule((email: string) => ok(email))),
        },
      });

      const eventList = events([userCreated, userUpdated]);

      expect(eventList).toBeDefined();
      expect(eventList.keys).toEqual(['user.created', 'user.updated']);
      expect(typeof eventList.add).toBe('function');
      expect(typeof eventList.list).toBe('function');
      expect(typeof eventList.pull).toBe('function');
    });

    it('should add events to the store', () => {
      const userCreated = event({
        key: 'user.created',
        value: {
          id: value(rule((id: string) => ok(id))),
          name: value(rule((name: string) => ok(name))),
        },
      });

      const eventList = events([userCreated]);

      eventList.add('user.created', { id: '123', name: 'John' });

      const eventData = eventList.list();
      expect(eventData).toHaveLength(1);
      expect(eventData[0].key).toBe('user.created');
      expect(eventData[0].value).toEqual({ id: '123', name: 'John' });
      expect(eventData[0].timestamp).toBeDefined();
    });

    it('should list events without removing them', () => {
      const userCreated = event({
        key: 'user.created',
        value: {
          id: value(rule((id: string) => ok(id))),
          name: value(rule((name: string) => ok(name))),
        },
      });

      const eventStore = events([userCreated]);

      eventStore.add('user.created', { id: '123', name: 'John' });
      eventStore.add('user.created', { id: '456', name: 'Jane' });

      const eventList = eventStore.list();
      expect(eventList).toHaveLength(2);
      expect(eventList[0].key).toBe('user.created');
      expect(eventList[1].key).toBe('user.created');
      expect(eventList[0].value.id).toBe('123');
      expect(eventList[1].value.id).toBe('456');
    });

    it('should pull events and remove them from store', () => {
      const userCreated = event({
        key: 'user.created',
        value: {
          id: value(rule((id: string) => ok(id))),
          name: value(rule((name: string) => ok(name))),
        },
      });

      const eventStore = events([userCreated]);

      eventStore.add('user.created', { id: '123', name: 'John' });
      eventStore.add('user.created', { id: '456', name: 'Jane' });

      const pulledEvents = eventStore.pull();
      expect(pulledEvents).toHaveLength(2);

      const remainingEvents = eventStore.list();
      expect(remainingEvents).toHaveLength(0);
    });

    it('should sort events by timestamp when listing', async () => {
      const userCreated = event({
        key: 'user.created',
        value: {
          id: value(rule((id: string) => ok(id))),
          name: value(rule((name: string) => ok(name))),
        },
      });

      const eventStore = events([userCreated]);

      eventStore.add('user.created', { id: '123', name: 'John' });
      await setTimeout(20);
      eventStore.add('user.created', { id: '456', name: 'Jane' });

      const pulledEvents = eventStore.list('asc');
      expect(pulledEvents[0].timestamp).toBeLessThan(pulledEvents[1].timestamp);

      const pulledEventsDesc = eventStore.list('desc');
      expect(pulledEventsDesc[0].timestamp).toBeGreaterThan(pulledEventsDesc[1].timestamp);
    });

    it('should sort events by timestamp when pulling', async () => {
      const userCreated = event({
        key: 'user.created',
        value: {
          id: value(rule((id: string) => ok(id))),
          name: value(rule((name: string) => ok(name))),
        },
      });

      const eventStore = events([userCreated]);

      eventStore.add('user.created', { id: '123', name: 'John' });
      await setTimeout(20);
      eventStore.add('user.created', { id: '456', name: 'Jane' });

      const pulledEvents = eventStore.pull('asc');
      expect(pulledEvents[0].timestamp).toBeLessThan(pulledEvents[1].timestamp);

      eventStore.add('user.created', { id: '123', name: 'John' });
      await setTimeout(20);
      eventStore.add('user.created', { id: '456', name: 'Jane' });

      const pulledEventsDesc = eventStore.pull('desc');
      expect(pulledEventsDesc[0].timestamp).toBeGreaterThan(pulledEventsDesc[1].timestamp);
    });

    it('should throw EventError for invalid keys', () => {
      const userCreated = event({
        key: 'user.created',
        value: {
          id: value(rule((id: string) => ok(id))),
          name: value(rule((name: string) => ok(name))),
        },
      });

      const eventStore = events([userCreated]);

      expect(() => {
        // @ts-expect-error - invalid key.
        eventStore.add('invalid.key', { id: '123', name: 'John' });
      }).toThrow(EventError);
    });
  });

  describe('Type safety', () => {
    it('should provide correct type inference for all public elements', () => {
      // Test event function
      expectTypeOf(event).toBeFunction();
      expectTypeOf(event).parameter(0).toMatchTypeOf<{
        key: string;
        value: Record<string, Value<Any, Any>>;
      }>();

      // Test events function
      expectTypeOf(events).toBeFunction();
      expectTypeOf(events).parameter(0).toBeArray();

      // Test EventError
      expectTypeOf(EventError).toBeObject();
    });

    it('should validate event constructor types', () => {
      const userCreated = event({
        key: 'user.created',
        value: {
          id: value(rule((id: string) => ok(id))),
          name: value(rule((name: string) => ok(name))),
        },
      });

      expectTypeOf(userCreated).toBeFunction();
      expectTypeOf(userCreated).parameter(0).toEqualTypeOf<{
        id: string;
        name: string;
      }>();

      const eventData = userCreated({ id: '123', name: 'John' });
      expectTypeOf(eventData).toEqualTypeOf<{
        key: 'user.created';
        value: { id: string; name: string };
        timestamp: number;
      }>();
    });

    it('should validate event store types', () => {
      const userCreated = event({
        key: 'user.created',
        value: {
          id: value(rule((id: string) => ok(id))),
          name: value(rule((name: string) => ok(name))),
        },
      });

      const eventList = events([userCreated]);

      expectTypeOf(eventList.keys).toBeArray();
      expectTypeOf(eventList.add).toBeFunction();
      expectTypeOf(eventList.list).toBeFunction();
      expectTypeOf(eventList.pull).toBeFunction();

      // Test add method types
      expectTypeOf(eventList.add).parameter(0).toBeString();
      expectTypeOf(eventList.add).parameter(1).toEqualTypeOf<{
        id: string;
        name: string;
      }>();
    });

    it('should validate complex event types', () => {
      const userUpdated = event({
        key: 'user.updated',
        value: {
          id: value(rule((id: string) => ok(id))),
          name: value(rule((name: string) => ok(name))),
          email: value(rule((email: string) => ok(email))),
          age: value(rule((age: number) => ok(age))),
        },
      });

      expectTypeOf(userUpdated).parameter(0).toEqualTypeOf<{
        id: string;
        name: string;
        email: string;
        age: number;
      }>();
    });
  });

  describe('Code examples', () => {
    it('should run example event-001: Basic event creation with Value types for validation', () => {
      // event-001: Basic event creation with Value types for validation.
      const userCreated = event({
        key: 'user.created',
        value: {
          id: value(rule((id: string) => ok(id))),
          name: value(rule((name: string) => ok(name))),
        },
      });

      const eventData = userCreated({ id: '123', name: 'John' });

      expect(eventData.key).toBe('user.created');
      expect(eventData.value).toEqual({ id: '123', name: 'John' });
      expect(eventData.timestamp).toBeDefined();
    });

    it('should run example event-002: Event creation with complex Value schema for validation', () => {
      // event-002: Event creation with complex Value schema for validation.
      const userUpdated = event({
        key: 'user.updated',
        value: {
          id: value(rule((id: string) => ok(id))),
          name: value(rule((name: string) => ok(name))),
          email: value(rule((email: string) => ok(email))),
          age: value(rule((age: number) => ok(age))),
        },
      });

      const eventData = userUpdated({
        id: '123',
        name: 'John',
        email: 'john@example.com',
        age: 30,
      });

      expect(eventData.key).toBe('user.updated');
      expect(eventData.value).toEqual({
        id: '123',
        name: 'John',
        email: 'john@example.com',
        age: 30,
      });
    });

    it('should run example event-003: Creating an event store with multiple event types', () => {
      // event-003: Creating an event store with multiple event types.
      const userCreated = event({
        key: 'user.created',
        value: {
          id: value(rule((id: string) => ok(id))),
          name: value(rule((name: string) => ok(name))),
        },
      });

      const userUpdated = event({
        key: 'user.updated',
        value: {
          id: value(rule((id: string) => ok(id))),
          name: value(rule((name: string) => ok(name))),
          email: value(rule((email: string) => ok(email))),
        },
      });

      const eventList = events([userCreated, userUpdated]);

      expect(eventList.keys).toEqual(['user.created', 'user.updated']);
      expect(typeof eventList.add).toBe('function');
      expect(typeof eventList.list).toBe('function');
      expect(typeof eventList.pull).toBe('function');
    });

    it('should run example event-004: Using the event store to add and retrieve events', () => {
      // event-004: Using the event store to add and retrieve events.
      const userCreated = event({
        key: 'user.created',
        value: {
          id: value(rule((id: string) => ok(id))),
          name: value(rule((name: string) => ok(name))),
        },
      });

      const userUpdated = event({
        key: 'user.updated',
        value: {
          id: value(rule((id: string) => ok(id))),
          name: value(rule((name: string) => ok(name))),
          email: value(rule((email: string) => ok(email))),
        },
      });

      const eventList = events([userCreated, userUpdated]);

      // Add events with type safety
      eventList.add('user.created', { id: '123', name: 'John' });
      eventList.add('user.updated', {
        id: '123',
        name: 'John',
        email: 'john@example.com',
      });

      // List all events
      const allEvents = eventList.list();
      expect(allEvents).toHaveLength(2);

      // Pull events (removes from store)
      const pulledEvents = eventList.pull('asc');
      expect(pulledEvents).toHaveLength(2);
    });

    it('should run example event-005: Error handling when adding events with invalid keys', () => {
      // event-005: Error handling when adding events with invalid keys.
      const userCreated = event({
        key: 'user.created',
        value: {
          id: value(rule((id: string) => ok(id))),
          name: value(rule((name: string) => ok(name))),
        },
      });

      const eventList = events([userCreated]);

      expect(() => {
        // @ts-expect-error - invalid key.
        eventList.add('invalid.key', { id: '123', name: 'John' });
      }).toThrow(EventError);

      try {
        // @ts-expect-error - invalid key.
        eventList.add('invalid.key', { id: '123', name: 'John' });
      } catch (error) {
        if (error instanceof EventError) {
          expect(error.key).toBe('EVENT:INVALID_KEY');
          expect(error.message).toContain('Event constructor not found for key: invalid.key');
        }
      }
    });
  });
});
