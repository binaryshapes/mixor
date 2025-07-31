import type { Any } from '../src/generics';
import { isTraceable, isTraced, traceInfo, traceable, tracer } from '../src/trace';

/**
 * trace-001: Basic function tracing.
 */
function traceBasicFunctionTracing() {
  console.log('\ntrace-001: Basic function tracing.');

  const add = (a: number, b: number) => a + b;
  const traceableAdd = traceable('math', add);

  const result = traceableAdd(5, 3);
  console.log('Result:', result);
  console.log('Is traceable:', isTraceable(traceableAdd));
  console.log('Is traced:', isTraced(traceableAdd));
}

/**
 * trace-002: Object tracing with metadata.
 */
function traceObjectTracingWithMetadata() {
  console.log('\ntrace-002: Object tracing with metadata.');

  const userService = {
    getUser: (id: string) => ({ id, name: 'John' }),
    updateUser: (id: string, data: Any) => ({ id, ...data }),
  };

  const traceableService = traceable('Service', userService).meta({
    scope: 'Authentication',
    name: 'UserService',
    description: 'User management operations',
  });

  const user = traceableService.getUser('123');
  console.log('User:', user);
  console.log('Is traceable:', isTraceable(traceableService));

  const info = traceInfo(traceableService);
  console.log('Service trace info:', info);
}

/**
 * trace-003: Async function tracing.
 */
function traceAsyncFunctionTracing() {
  console.log('\ntrace-003: Async function tracing.');

  const asyncOperation = async (data: string) => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return `Processed: ${data}`;
  };

  const traceableAsync = traceable('async', asyncOperation);

  // Execute the async function
  traceableAsync('test').then((result) => {
    console.log('Async result:', result);
    console.log('Is traceable:', isTraceable(traceableAsync));
  });
}

/**
 * trace-004: Check if element is traceable.
 */
function traceCheckIfElementIsTraceable() {
  console.log('\ntrace-004: Check if element is traceable.');

  const fn = () => 'test';
  const tracedFn = traceable('test', () => 'test');

  const isTraceableResult = isTraceable(tracedFn);
  console.log('Is traceable:', isTraceableResult);

  const isNotTraceable = isTraceable(fn);
  console.log('Is not traceable:', isNotTraceable);
}

/**
 * trace-005: Check if element is traced.
 */
function traceCheckIfElementIsTraced() {
  console.log('\ntrace-005: Check if element is traced.');

  const traceableFn = traceable('test', () => 'test');
  const tracedFn = traceable('test', () => 'test').trace();

  const isTracedResult = isTraced(tracedFn);
  console.log('Is traced:', isTracedResult);

  const isNotTraced = isTraced(traceableFn);
  console.log('Is not traced:', isNotTraced);
}

/**
 * trace-006: Tracer event subscription.
 */
function traceTracerEventSubscription() {
  console.log('\ntrace-006: Tracer event subscription.');

  // Set up event listeners
  tracer.on('start', (data) => {
    console.log('Function started:', data.input);
  });

  tracer.on('perf', (data) => {
    console.log(`Duration: ${data.durationMs}ms`);
    if (data.async) {
      console.log('Async function completed');
    }
  });

  tracer.on('error', (data) => {
    console.log('Error occurred:', data.error);
    if (data.async) {
      console.log('Async function error');
    }
  });

  // Create and execute a traced function
  const fn = traceable('test', (x: number) => x * 2);
  const tracedFn = fn.trace();

  const result = tracedFn(5);
  console.log('Function result:', result);
}

/**
 * trace-007: Custom trace event emission.
 */
function traceCustomTraceEventEmission() {
  console.log('\ntrace-007: Custom trace event emission.');

  tracer.emit('perf', {
    durationMs: 150,
    start: process.hrtime.bigint(),
    end: process.hrtime.bigint(),
    input: { type: 'number', values: [5] },
    output: { type: 'number', values: 10 },
    meta: { name: 'test' },
    async: false,
  });

  console.log('Custom trace event emitted');
}

/**
 * trace-008: Subscribe to trace events once.
 */
function traceSubscribeToTraceEventsOnce() {
  console.log('\ntrace-008: Subscribe to trace events once.');

  tracer.once('perf', (data) => {
    console.log(`First function took ${data.durationMs}ms`);
  });

  const fn = traceable('test', (x: number) => x * 2).trace();
  fn(5); // This will trigger the once listener
  fn(10); // This will NOT trigger the once listener

  console.log('Once event listener executed');
}

/**
 * trace-009: Get trace information for an element.
 */
function traceGetTraceInformationForElement() {
  console.log('\ntrace-009: Get trace information for an element.');

  const fn = () => 'test';
  const traceableFn = traceable('test', fn).meta({
    name: 'TestFunction',
    description: 'A simple test function',
    scope: 'testing',
  });

  const info = traceInfo(traceableFn);
  console.log('Trace info:', info);
  console.log('Is traceable:', isTraceable(traceableFn));
  console.log('Is traced:', isTraced(traceableFn));
}

// Execute all examples
traceBasicFunctionTracing();
traceObjectTracingWithMetadata();
traceAsyncFunctionTracing();
traceCheckIfElementIsTraceable();
traceCheckIfElementIsTraced();
traceTracerEventSubscription();
traceCustomTraceEventEmission();
traceSubscribeToTraceEventsOnce();
traceGetTraceInformationForElement();
