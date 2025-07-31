import { setTimeout } from 'node:timers/promises';
import type { Any } from 'src/generics';
import { describe, expect, expectTypeOf, it } from 'vitest';

import { TraceableError, isTraceable, isTraced, traceInfo, traceable, tracer } from '../src/trace';

// Shared test utilities
const createTestHelpers = () => ({
  createMockFunction: () => (a: number, b: number) => a + b,
  createMockAsyncFunction: () => async (data: string) => {
    await setTimeout(10);
    return `Processed: ${data}`;
  },
  createMockService: () => ({
    getUser: (id: string) => ({ id, name: 'John' }),
    updateUser: (id: string, data: Any) => ({ id, ...data }),
  }),
  createMockErrorFunction: () => () => {
    throw new Error('Test error');
  },
});

describe('trace', () => {
  const helpers = createTestHelpers();

  describe('Basic functionality', () => {
    it('should make functions traceable', () => {
      const fn = helpers.createMockFunction();
      const traceableFn = traceable('test', fn);

      expect(isTraceable(traceableFn)).toBe(true);
      expect(isTraced(traceableFn)).toBe(false);
      expect(traceableFn(2, 3)).toBe(5);
    });

    it('should make objects traceable', () => {
      const service = helpers.createMockService();
      const traceableService = traceable('service', service);

      expect(isTraceable(traceableService)).toBe(true);
      expect(traceableService.getUser('123')).toEqual({ id: '123', name: 'John' });
    });

    it('should allow metadata configuration', () => {
      const fn = helpers.createMockFunction();
      const traceableFn = traceable('test', fn).meta({
        name: 'TestFunction',
        description: 'A test function',
        scope: 'testing',
      });

      const info = traceInfo(traceableFn);
      expect(info.meta.name).toBe('TestFunction');
      expect(info.meta.description).toBe('A test function');
      expect(info.meta.scope).toBe('testing');
    });

    it('should allow parent-child relationships', () => {
      const parentFn = helpers.createMockFunction();
      const childFn = helpers.createMockFunction();

      const traceableParent = traceable('parent', parentFn);
      const traceableChild = traceable('child', childFn).parent(traceableParent);

      const childInfo = traceInfo(traceableChild);
      const parentInfo = traceInfo(traceableParent);

      expect(childInfo.parentId).toBe(parentInfo.id);
    });

    it('should enable tracing with performance monitoring', () => {
      const fn = helpers.createMockFunction();
      const traceableFn = traceable('test', fn);
      const tracedFn = traceableFn.trace();

      expect(isTraced(tracedFn)).toBe(true);
      expect(tracedFn(2, 3)).toBe(5);
    });

    it('should handle async functions', async () => {
      const asyncFn = helpers.createMockAsyncFunction();
      const traceableAsync = traceable('async', asyncFn);
      const tracedAsync = traceableAsync.trace();

      const result = await tracedAsync('test');
      expect(result).toBe('Processed: test');
    });

    it('should emit tracer events', () => {
      const events: Any[] = [];

      tracer.on('start', (data: Any) => {
        events.push({ type: 'start', data });
      });

      tracer.on('perf', (data: Any) => {
        events.push({ type: 'perf', data });
      });

      const fn = helpers.createMockFunction();
      const tracedFn = traceable('test', fn).trace();
      tracedFn(2, 3);

      expect(events.length).toBeGreaterThan(0);
      expect(events.some((e) => e.type === 'start')).toBe(true);
      expect(events.some((e) => e.type === 'perf')).toBe(true);
    });

    it('should handle errors in traced functions', () => {
      const errorFn = helpers.createMockErrorFunction();
      const tracedErrorFn = traceable('error', errorFn).trace();

      const events: Any[] = [];
      tracer.on('error', (data: Any) => {
        events.push({ type: 'error', data });
      });

      expect(() => tracedErrorFn()).toThrow('Test error');
      expect(events.length).toBeGreaterThan(0);
      expect(events.some((e) => e.type === 'error')).toBe(true);
    });

    it('should handle errors in async traced functions', async () => {
      const asyncErrorFn = async () => {
        await setTimeout(10);
        throw new Error('Async test error');
      };

      const tracedAsyncErrorFn = traceable('async-error', asyncErrorFn).trace();

      const events: Any[] = [];
      tracer.on('error', (data: Any) => {
        events.push({ type: 'error', data });
      });

      await expect(tracedAsyncErrorFn()).rejects.toThrow('Async test error');
      expect(events.length).toBeGreaterThan(0);
      expect(events.some((e) => e.type === 'error')).toBe(true);
    });

    it('should handle traced complex functions', () => {
      type CreateUser = {
        name: string;
        email: string;
        password: string;
      };

      // Subscribe to trace events
      const events: Any[] = [];
      tracer.on('perf', (data: Any) => {
        events.push({ type: 'perf', data });
      });

      const createUser = (user: CreateUser) => ({ ...user, tags: ['user', 'actived'] });
      const traceableCreateUser = traceable('test', createUser).trace();

      const user = traceableCreateUser({
        name: 'John',
        email: 'john@example.com',
        password: '123456',
      });

      setTimeout(10);

      expect(events[0].data.input).toEqual({
        type: [{ name: 'string', email: 'string', password: 'string' }],
        values: [{ name: 'John', email: 'john@example.com', password: '123456' }],
      });
      expect(events[0].data.output).toEqual({
        type: {
          name: 'string',
          email: 'string',
          password: 'string',
          tags: ['string', 'string'],
        },
        values: {
          name: 'John',
          email: 'john@example.com',
          password: '123456',
          tags: ['user', 'actived'],
        },
      });

      expect(user).toEqual({
        name: 'John',
        email: 'john@example.com',
        password: '123456',
        tags: ['user', 'actived'],
      });
    });
  });

  describe('Type safety', () => {
    it('should provide correct type inference for all public elements', () => {
      // Test traceable function
      expectTypeOf(traceable).toBeFunction();
      expectTypeOf(traceable('test', () => 'test')).toBeObject();

      // Test isTraceable function
      expectTypeOf(isTraceable).toBeFunction();
      expectTypeOf(isTraceable(() => 'test')).toBeBoolean();

      // Test isTraced function
      expectTypeOf(isTraced).toBeFunction();
      expectTypeOf(isTraced(() => 'test')).toBeBoolean();

      // Test traceInfo function
      expectTypeOf(traceInfo).toBeFunction();

      // Test tracer object
      expectTypeOf(tracer).toBeObject();
      expectTypeOf(tracer.emit).toBeFunction();
      expectTypeOf(tracer.on).toBeFunction();
      expectTypeOf(tracer.once).toBeFunction();

      // Test TraceableError
      expectTypeOf(TraceableError).toBeObject();
    });

    it('should validate generic type constraints', () => {
      // Test traceable with different types
      const stringFn = () => 'test';
      const numberFn = () => 42;
      const objectFn = () => ({ test: true });

      expectTypeOf(traceable('number', numberFn)).toBeObject();
      expectTypeOf(traceable('object', objectFn)).toBeObject();

      // Test with metadata
      const traceableWithMeta = traceable('test', stringFn).meta({
        name: 'TestFunction',
        description: 'A test function',
        scope: 'testing',
      });

      expectTypeOf(traceableWithMeta).toBeObject();

      // Should throw if trying to make an already traceable element traceable
      expect(() => traceable('test', traceableWithMeta)).toThrow(TraceableError);
    });

    it('should validate traceable element structure', () => {
      const fn = () => 'test';
      const traceableFn = traceable('test', fn);

      // Test that traceable elements have required properties
      expectTypeOf(traceableFn.meta).toBeFunction();
      expectTypeOf(traceableFn.parent).toBeFunction();
      expectTypeOf(traceableFn.trace).toBeFunction();
      expectTypeOf(traceableFn['~trace']).toBeObject();
    });

    it('should validate trace info structure', () => {
      const fn = () => 'test';
      const traceableFn = traceable('test', fn);
      const info = traceInfo(traceableFn);

      expectTypeOf(info.id).toBeString();
      expectTypeOf(info.tag).toBeString();
      expectTypeOf(info.name).toBeString();
      expectTypeOf(info.traced).toBeBoolean();
      expectTypeOf(info.hash).toBeString();
      expectTypeOf(info.meta).toBeObject();
    });
  });

  describe('Code examples', () => {
    it('should run example trace-001: Basic function tracing', () => {
      const add = (a: number, b: number) => a + b;
      const traceableAdd = traceable('math', add);

      const result = traceableAdd(5, 3);
      expect(result).toBe(8);
    });

    it('should run example trace-002: Object tracing with metadata', () => {
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
      expect(user).toEqual({ id: '123', name: 'John' });
    });

    it('should run example trace-003: Async function tracing', async () => {
      const asyncOperation = async (data: string) => {
        await setTimeout(100);
        return `Processed: ${data}`;
      };

      const traceableAsync = traceable('async', asyncOperation);
      const result = await traceableAsync('test');
      expect(result).toBe('Processed: test');
    });

    it('should run example trace-004: Check if element is traceable', () => {
      const fn = () => 'test';
      const tracedFn = traceable('test', () => 'test');

      const isTraceableResult = isTraceable(tracedFn);
      expect(isTraceableResult).toBe(true);

      const isNotTraceable = isTraceable(fn);
      expect(isNotTraceable).toBe(false);
    });

    it('should run example trace-005: Check if element is traced', () => {
      const traceableFn = traceable('test', () => 'test');
      const tracedFn = traceable('test', () => 'test').trace();

      const isTracedResult = isTraced(tracedFn);
      expect(isTracedResult).toBe(true);

      const isNotTraced = isTraced(traceableFn);
      expect(isNotTraced).toBe(false);
    });

    it('should run example trace-006: Tracer event subscription', () => {
      const events: Any[] = [];

      tracer.on('start', (data: Any) => {
        events.push({ type: 'start', input: data.input });
      });

      tracer.on('perf', (data: Any) => {
        events.push({ type: 'perf', duration: data.durationMs, async: data.async });
      });

      tracer.on('error', (data: Any) => {
        events.push({ type: 'error', error: data.error, async: data.async });
      });

      const fn = traceable('test', (x: number) => x * 2);
      const tracedFn = fn.trace();

      const result = tracedFn(5);
      expect(result).toBe(10);
      expect(events.length).toBeGreaterThan(0);
    });

    it('should run example trace-007: Custom trace event emission', () => {
      const events: Any[] = [];

      tracer.on('perf', (data: Any) => {
        events.push(data);
      });

      tracer.emit('perf', {
        durationMs: 150,
        start: process.hrtime.bigint(),
        end: process.hrtime.bigint(),
        input: { type: 'number', values: [5] },
        output: { type: 'number', values: 10 },
        meta: { name: 'test' },
        async: false,
      });

      expect(events.length).toBe(1);
      expect(events[0].durationMs).toBe(150);
    });

    it('should run example trace-008: Subscribe to trace events once', () => {
      const events: Any[] = [];

      tracer.once('perf', (data) => {
        events.push({ type: 'once', duration: data.durationMs });
      });

      const fn = traceable('test', (x: number) => x * 2).trace();
      fn(5); // This will trigger the once listener
      fn(10); // This will NOT trigger the once listener

      expect(events.length).toBe(1);
      expect(events[0].type).toBe('once');
    });

    it('should run example trace-009: Get trace information for an element', () => {
      const fn = () => 'test';
      const traceableFn = traceable('test', fn).meta({
        name: 'TestFunction',
        description: 'A simple test function',
        scope: 'testing',
      });

      const info = traceInfo(traceableFn);
      expect(info.id).toBeDefined();
      expect(info.tag).toBe('test');
      expect(info.name).toBe('fn');
      expect(info.traced).toBe(false);
      expect(info.meta.name).toBe('TestFunction');
      expect(info.meta.description).toBe('A simple test function');
      expect(info.meta.scope).toBe('testing');
    });
  });

  describe('Error handling', () => {
    it('should throw error when trying to make already traceable element traceable', () => {
      const fn = () => 'test';
      const traceableFn = traceable('test', fn);

      expect(() => traceable('test', traceableFn)).toThrow(TraceableError);
    });

    it('should throw error when trying to trace non-function element', () => {
      const obj = { test: true };
      const traceableObj = traceable('test', obj);

      expect(() => traceableObj.trace()).toThrow(TraceableError);
    });

    it('should throw error when trying to trace already traced element', () => {
      const fn = () => 'test';
      const traceableFn = traceable('test', fn);
      const tracedFn = traceableFn.trace();

      expect(() => tracedFn.trace()).toThrow(TraceableError);
    });

    it('should throw error when trying to get trace info for non-traceable element', () => {
      const fn = () => 'test';

      expect(() => traceInfo(fn as Any)).toThrow(TraceableError);
    });

    it('should throw error when trying to set parent for non-traceable element', () => {
      const fn = () => 'test';
      const traceableFn = traceable('test', () => 'test');

      expect(() => traceableFn.parent(fn as Any)).toThrow(TraceableError);
    });
  });

  describe('Edge cases', () => {
    it('should handle functions without names', () => {
      const traceableFn = traceable('test', () => 'test');

      const info = traceInfo(traceableFn);
      expect(info.name).toBe('anonymous');
    });

    it('should handle nested objects in function arguments', () => {
      const fn = (obj: Any) => obj;
      const traceableFn = traceable('test', fn);

      const result = traceableFn({ nested: { value: 42 } });
      expect(result).toEqual({ nested: { value: 42 } });
    });

    it('should handle arrays in function arguments', () => {
      const fn = (arr: Any[]) => arr.length;
      const traceableFn = traceable('test', fn);

      const result = traceableFn([1, 2, 3]);
      expect(result).toBe(3);
    });

    it('should handle primitive values in function arguments', () => {
      const fn = (str: string, num: number, bool: boolean) => `${str}-${num}-${bool}`;
      const traceableFn = traceable('test', fn);

      const result = traceableFn('test', 42, true);
      expect(result).toBe('test-42-true');
    });
  });
});
