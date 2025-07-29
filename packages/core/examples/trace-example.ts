import { setTimeout } from 'node:timers/promises';

import { TraceableError, isTraceable, traceable, tracer } from '../src/trace';

/**
 * trace-001: Basic error handling.
 */
function traceBasicErrorHandling() {
  console.log('\ntrace-001: Basic error handling.');

  try {
    const fn = () => 'test';
    const tracedFn = traceable('test', fn);
    traceable('test', tracedFn); // This will throw
  } catch (error) {
    if (error instanceof TraceableError) {
      console.log('Error key:', error.key);
      console.log('Error message:', error.message);
    }
  }
}

/**
 * trace-002: Check if element is traceable.
 */
function traceCheckTraceable() {
  console.log('\ntrace-002: Check if element is traceable.');

  const fn = () => 'test';
  const tracedFn = traceable('test', fn);

  const isTraced = isTraceable(tracedFn);
  console.log('Is traced function traceable:', isTraced);

  const isNotTraced = isTraceable(fn);
  console.log('Is original function traceable:', isNotTraced);
}

/**
 * trace-003: Basic function tracing.
 */
function traceBasicFunctionTracing() {
  console.log('\ntrace-003: Basic function tracing.');

  const fn = (x: number) => x * 2;
  const tracedFn = traceable('math', fn);

  const result = tracedFn(5);
  console.log('Result:', result);
  console.log('Function name:', tracedFn.name);
}

/**
 * trace-004: Object tracing with metadata.
 */
function traceObjectTracing() {
  console.log('\ntrace-004: Object tracing with metadata.');

  const obj = { value: 42 };
  const tracedObj = traceable('data', obj)
    .set('name', 'testObject')
    .set('description', 'Test object for tracing')
    .set('scope', 'example')
    .set('doc', 'https://example.com/docs');

  console.log('Traced object:', tracedObj);
  console.log('Object value:', tracedObj.value);
  console.log('Metadata:', tracedObj['~meta']);
}

/**
 * trace-005: Hierarchical tracing with parentId.
 */
function traceHierarchicalTracing() {
  console.log('\ntrace-005: Hierarchical tracing with parentId.');

  const parentFn = traceable('parent', () => 'parent');
  const childFn = traceable('child', () => 'child', parentFn['~data'].id);

  console.log('Parent function data:', parentFn['~data']);
  console.log('Child function data:', childFn['~data']);
  console.log('Parent ID in child:', childFn['~data'].parentId);
}

/**
 * trace-006: Emit custom trace event.
 */
function traceEmitCustomEvent() {
  console.log('\ntrace-006: Emit custom trace event.');

  tracer.emit('perf', {
    durationMs: 150,
    start: process.hrtime.bigint(),
    end: process.hrtime.bigint(),
    input: { type: 'number', values: [5] },
    output: { type: 'number', values: 10 },
    meta: { name: 'test' },
    async: false,
  });

  console.log('Custom event emitted');
}

/**
 * trace-007: Subscribe to trace events.
 */
function traceSubscribeToEvents() {
  console.log('\ntrace-007: Subscribe to trace events.');

  const startListener = (data: { input: unknown }) => {
    console.log('Function started:', data.input);
  };

  const perfListener = (data: { durationMs: number; async?: boolean }) => {
    console.log(`Duration: ${data.durationMs}ms`);
    if (data.async) {
      console.log('Async function completed');
    }
  };

  tracer.on('start', startListener);
  tracer.on('perf', perfListener);

  const fn = traceable('test', (x: number) => x + 1);
  const result = fn(10);

  console.log('Result:', result);
}

/**
 * trace-008: Subscribe to trace events once.
 */
function traceSubscribeOnce() {
  console.log('\ntrace-008: Subscribe to trace events once.');

  let onceCalled = false;
  const onceListener = (data: { durationMs: number }) => {
    onceCalled = true;
    console.log(`First function took ${data.durationMs}ms`);
  };

  tracer.once('perf', onceListener);

  const fn = traceable('test', (x: number) => x * 2);
  fn(5); // This will trigger the once listener.
  fn(10); // This will NOT trigger the once listener.

  console.log('Once listener called:', onceCalled);
}

/**
 * trace-009: Tracer event subscription.
 */
function traceEventSubscription() {
  console.log('\ntrace-009: Tracer event subscription.');

  const startListener = (data: { input: unknown }) => {
    console.log('Function started with input:', data.input);
  };

  const perfListener = (data: { durationMs: number; async?: boolean }) => {
    console.log(`Duration: ${data.durationMs}ms`);
    if (data.async) {
      console.log('Async function completed');
    }
  };

  const errorListener = (data: { error: Error; async?: boolean }) => {
    console.log('Error occurred:', data.error);
    if (data.async) {
      console.log('Async function error');
    }
  };

  tracer.on('start', startListener);
  tracer.on('perf', perfListener);
  tracer.on('error', errorListener);

  const fn = traceable('test', (x: number) => x + 1);
  const result = fn(10);

  console.log('Result:', result);
}

/**
 * trace-010: Async function tracing.
 */
async function traceAsyncFunctionTracing() {
  console.log('\ntrace-010: Async function tracing.');

  const asyncFn = async (x: number) => {
    await setTimeout(100);
    return x * 2;
  };
  const tracedAsyncFn = traceable('async', asyncFn);

  const result = await tracedAsyncFn(5);
  console.log('Result:', result);
}

/**
 * trace-011: Async function with error handling.
 */
async function traceAsyncErrorHandling() {
  console.log('\ntrace-011: Async function with error handling.');

  const asyncFn = traceable('async', async (x: number) => {
    if (x < 0) throw new Error('Negative number');
    return x * 2;
  });

  try {
    const result = await asyncFn(5);
    console.log('Result:', result);
  } catch (error) {
    console.log('Error caught:', (error as Error).message);
  }
}

// Execute all examples
traceBasicErrorHandling();
traceCheckTraceable();
traceBasicFunctionTracing();
traceObjectTracing();
traceHierarchicalTracing();
traceEmitCustomEvent();
traceSubscribeToEvents();
traceSubscribeOnce();
traceEventSubscription();
traceAsyncFunctionTracing();
traceAsyncErrorHandling();
