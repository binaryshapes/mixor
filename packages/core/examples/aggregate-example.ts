import { schema, value } from '../src';
import { aggregate } from '../src/aggregate';
import { event, events } from '../src/event';
import { isErr, isOk, ok } from '../src/result';

/**
 * aggregate-001: Basic aggregate creation with schema validation.
 */
function aggregateBasicUsage() {
  console.log('\naggregate-001: Basic aggregate creation with schema validation.');

  const userAggregate = aggregate({
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
  });

  const result = userAggregate({
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
  });

  console.log('Result:', result);
  console.log('Result type:', typeof result);

  if (isOk(result)) {
    const user = result.value;
    console.log('User name:', user.name);
    console.log('User email:', user.email);

    const updateResult = user.updateName('Jane Doe');
    console.log('Update result:', updateResult);
  }
}

/**
 * aggregate-002: Aggregate with simple state management.
 */
function aggregateWithStateManagement() {
  console.log('\naggregate-002: Aggregate with simple state management.');

  const orderAggregate = aggregate({
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
  });

  const result = orderAggregate({
    id: 'order-1',
    total: 100,
    status: 'pending',
  });

  console.log('Result:', result);

  if (isOk(result)) {
    const order = result.value;
    console.log('Order total:', order.total);

    const updateResult = order.updateTotal(150);
    console.log('Update result:', updateResult);

    const stateResult = order.getCurrentState();
    console.log('Current state:', stateResult);
  }
}

/**
 * aggregate-003: Aggregate with event handling and documentation.
 */
function aggregateWithEvents() {
  console.log('\naggregate-003: Aggregate with event handling and documentation.');

  // Define events for the product aggregate
  const stockReducedEvent = event('Stock reduced event', {
    key: 'stock.reduced',
    value: {
      quantity: value((quantity: number) => ok(quantity)),
    },
  });

  const productAggregate = aggregate('Product aggregate with inventory management', {
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

  const result = productAggregate({
    id: 'prod-1',
    name: 'Widget',
    stock: 50,
  });

  console.log('Result:', result);

  if (isOk(result)) {
    const product = result.value;
    console.log('Product name:', product.name);
    console.log('Initial stock:', product.stock);

    const reduceResult = product.reduceStock(10);
    console.log('Reduce stock result:', reduceResult);

    if (isOk(reduceResult)) {
      console.log('Updated stock:', reduceResult.value.stock);
      console.log('Events:', product.getEvents());
    }
  }
}

/**
 * aggregate-004: Handling aggregate configuration errors.
 */
function aggregateErrorHandling() {
  console.log('\naggregate-004: Handling aggregate configuration errors.');

  try {
    // @ts-expect-error - This is a test error.
    aggregate(null);
    console.log('This should not execute');
  } catch (error) {
    console.log('Caught error:', error);
    console.log('Error message:', (error as Error).message);
  }
}

// Execute all examples
aggregateBasicUsage();
aggregateWithStateManagement();
aggregateWithEvents();
aggregateErrorHandling();
