import { describe, expect, expectTypeOf, it } from 'vitest';

import { schema, value } from '../src';
import { AggregateError, aggregate } from '../src/aggregate';
import { event, events } from '../src/event';
import { isErr, isOk, ok } from '../src/result';

// Shared test helpers.
const createTestHelpers = () => ({
  createUserAggregate: () =>
    aggregate({
      schema: schema({
        id: value((id: string) => ok(id)),
        name: value((name: string) => ok(name)),
        email: value((email: string) => ok(email)),
      }),
      events: events([]),
      specs: {},
      methods: ({ self, fn }) => ({
        updateName: fn('Update user name', (name: string) => {
          return self.set('name', name);
        }),
      }),
    }),

  createOrderAggregate: () =>
    aggregate({
      schema: schema({
        id: value((id: string) => ok(id)),
        total: value((total: number) => ok(total)),
        status: value((status: string) => ok(status)),
      }),
      events: events([]),
      specs: {},
      methods: ({ self, fn }) => ({
        updateTotal: fn('Update order total', (total: number) => {
          return self.set('total', total);
        }),
        getCurrentState: fn('Get current state', () => {
          return ok(self.getState());
        }),
      }),
    }),

  createProductAggregate: () => {
    const stockReducedEvent = event('Stock reduced event', {
      key: 'stock.reduced',
      value: {
        quantity: value((quantity: number) => ok(quantity)),
      },
    });

    return aggregate('Product aggregate with inventory management', {
      schema: schema({
        id: value((id: string) => ok(id)),
        name: value((name: string) => ok(name)),
        stock: value((stock: number) => ok(stock)),
      }),
      events: events([stockReducedEvent]),
      specs: {},
      methods: ({ self, fn }) => ({
        reduceStock: fn('Reduce product stock', (quantity: number) => {
          const newStock = self.getState().stock - quantity;
          const setResult = self.set('stock', newStock);
          if (isErr(setResult)) return setResult;

          self.emit('stock.reduced', { quantity });
          return ok(self.getState());
        }),
      }),
    });
  },

  createBasicUserAggregate: () =>
    aggregate({
      schema: schema({
        id: value((id: string) => ok(id)),
        name: value((name: string) => ok(name)),
      }),
      events: events([]),
      specs: {},
      methods: ({ self, fn }) => ({
        updateName: fn('Update name', (name: string) => self.set('name', name)),
      }),
    }),
});

describe('aggregate', () => {
  const helpers = createTestHelpers();

  describe('Basic functionality', () => {
    it('should create an aggregate with schema validation', () => {
      const userAggregate = helpers.createUserAggregate();
      const result = userAggregate({
        id: 'user-1',
        name: 'John Doe',
        email: 'john@example.com',
      });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        const user = result.value;
        expect(user.name).toBe('John Doe');
        expect(user.email).toBe('john@example.com');

        const updateResult = user.updateName('Jane Doe');
        expect(isOk(updateResult)).toBe(true);
      }
    });

    it('should handle aggregate with state management', () => {
      const orderAggregate = helpers.createOrderAggregate();
      const result = orderAggregate({
        id: 'order-1',
        total: 100,
        status: 'pending',
      });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        const order = result.value;
        expect(order.total).toBe(100);

        const updateResult = order.updateTotal(150);
        expect(isOk(updateResult)).toBe(true);

        const stateResult = order.getCurrentState();
        expect(isOk(stateResult)).toBe(true);
      }
    });

    it('should handle aggregate with events', () => {
      const productAggregate = helpers.createProductAggregate();
      const result = productAggregate({
        id: 'prod-1',
        name: 'Widget',
        stock: 50,
      });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        const product = result.value;
        expect(product.name).toBe('Widget');
        expect(product.stock).toBe(50);

        const reduceResult = product.reduceStock(10);
        expect(isOk(reduceResult)).toBe(true);

        if (isOk(reduceResult)) {
          expect(reduceResult.value.stock).toBe(40);
          expect(product.getEvents()).toHaveLength(1);
        }
      }
    });
  });

  describe('Type safety', () => {
    it('should provide correct type inference for all public elements', () => {
      expectTypeOf(aggregate).toBeFunction();
    });

    it('should validate aggregate configuration types', () => {
      const userAggregate = helpers.createBasicUserAggregate();
      expectTypeOf(userAggregate).toBeFunction();
      expectTypeOf(userAggregate({ id: 'test', name: 'test' })).toMatchTypeOf<
        ReturnType<typeof userAggregate>
      >();
    });

    it('should validate aggregate instance types', () => {
      const userAggregate = helpers.createBasicUserAggregate();
      const result = userAggregate({ id: 'test', name: 'test' });

      if (isOk(result)) {
        const user = result.value;
        expectTypeOf(user.id).toBeString();
        expectTypeOf(user.name).toBeString();
        expectTypeOf(user.updateName).toBeFunction();
        expectTypeOf(user.getState).toBeFunction();
      }
    });
  });

  describe('Code examples', () => {
    it('should run example aggregate-001: Basic aggregate creation with schema validation', () => {
      const userAggregate = helpers.createUserAggregate();
      const result = userAggregate({
        id: 'user-1',
        name: 'John Doe',
        email: 'john@example.com',
      });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        const user = result.value;
        expect(user.name).toBe('John Doe');
        expect(user.email).toBe('john@example.com');

        const updateResult = user.updateName('Jane Doe');
        expect(isOk(updateResult)).toBe(true);
      }
    });

    it('should run example aggregate-002: Aggregate with simple state management', () => {
      const orderAggregate = helpers.createOrderAggregate();
      const result = orderAggregate({
        id: 'order-1',
        total: 100,
        status: 'pending',
      });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        const order = result.value;
        expect(order.total).toBe(100);

        const updateResult = order.updateTotal(150);
        expect(isOk(updateResult)).toBe(true);

        const stateResult = order.getCurrentState();
        expect(isOk(stateResult)).toBe(true);
      }
    });

    it('should run example aggregate-003: Aggregate with event handling and documentation', () => {
      const productAggregate = helpers.createProductAggregate();
      const result = productAggregate({
        id: 'prod-1',
        name: 'Widget',
        stock: 50,
      });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        const product = result.value;
        expect(product.name).toBe('Widget');
        expect(product.stock).toBe(50);

        const reduceResult = product.reduceStock(10);
        expect(isOk(reduceResult)).toBe(true);

        if (isOk(reduceResult)) {
          expect(reduceResult.value.stock).toBe(40);
          expect(product.getEvents()).toHaveLength(1);
        }
      }
    });

    it('should run example aggregate-004: Handling aggregate configuration errors', () => {
      expect(() => {
        // @ts-expect-error - This is a test error.
        aggregate(null);
      }).toThrow(AggregateError);

      try {
        // @ts-expect-error - This is a test error.
        aggregate(null);
      } catch (error) {
        expect(error).toBeInstanceOf(AggregateError);
        expect((error as AggregateError).message).toBe('Invalid aggregate configuration.');
      }
    });
  });
});
