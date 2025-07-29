import { setTimeout } from 'node:timers/promises';
import type { Any } from 'src/generics';
import { beforeEach, describe, expect, expectTypeOf, it } from 'vitest';

import { TraceableError, isTraceable, traceable, tracer } from '../src/trace';

// Shared test utilities
const createTestHelpers = () => ({
  createMockFunction: () => (x: number) => x * 2,
  createMockObject: () => ({ value: 42 }),
  createAsyncFunction: () => async (x: number) => {
    await setTimeout(100);
    return x * 2;
  },
  createErrorFunction: () => async (x: number) => {
    if (x < 0) throw new Error('Negative number not allowed');
    return x * 2;
  },
  createSyncErrorFunction: () => (x: number) => {
    if (x < 0) throw new Error('Negative number not allowed');
    return x * 2;
  },
});

// Shared event collectors for Basic functionality tests
let startEvents: Any[] = [];
let perfEvents: Any[] = [];
let errorEvents: Any[] = [];

// Set up shared listeners
tracer.on('start', (data) => startEvents.push(data));
tracer.on('perf', (data) => perfEvents.push(data));
tracer.on('error', (data) => errorEvents.push(data));

describe('Trace', () => {
  const helpers = createTestHelpers();

  beforeEach(() => {
    // Reset event collectors
    startEvents = [];
    perfEvents = [];
    errorEvents = [];
  });

  describe('Basic functionality', () => {
    it('should create traceable functions', () => {
      const fn = helpers.createMockFunction();
      const tracedFn = traceable('math', fn);

      expect(tracedFn).toBeDefined();
      expect(typeof tracedFn).toBe('function');
      expect(tracedFn.name).toBe('');
      expect(isTraceable(tracedFn)).toBe(true);
    });

    it('should create traceable objects', () => {
      const obj = helpers.createMockObject();
      const tracedObj = traceable('data', obj);

      expect(tracedObj).toBeDefined();
      expect(typeof tracedObj).toBe('object');
      expect(tracedObj.value).toBe(42);
      expect(isTraceable(tracedObj)).toBe(true);
    });

    it('should preserve function behavior', () => {
      const fn = helpers.createMockFunction();
      const tracedFn = traceable('math', fn);

      const result = tracedFn(5);
      expect(result).toBe(10);
    });

    it('should preserve object behavior', () => {
      const obj = helpers.createMockObject();
      const tracedObj = traceable('data', obj);

      expect(tracedObj.value).toBe(42);
    });

    it('should generate unique IDs for traced elements', () => {
      const fn1 = helpers.createMockFunction();
      const fn2 = helpers.createMockFunction();

      const tracedFn1 = traceable('math', fn1);
      const tracedFn2 = traceable('math', fn2);

      expect(tracedFn1['~data'].id).toBeDefined();
      expect(tracedFn2['~data'].id).toBeDefined();
      expect(tracedFn1['~data'].id).not.toBe(tracedFn2['~data'].id);
    });

    it('should set correct metadata', () => {
      const fn = helpers.createMockFunction();
      const tracedFn = traceable('math', fn);

      expect(tracedFn['~data'].tag).toBe('math');
      expect(tracedFn['~data'].type).toBe('function');
      expect(tracedFn['~data'].name).toBe('anonymous');
      expect(tracedFn['~meta']).toEqual({});
    });

    it('should handle functions with names', () => {
      const namedFn = function testFunction() {
        return 'test';
      };
      const tracedNamedFn = traceable('test', namedFn);

      expect(tracedNamedFn['~data'].name).toBe('testFunction');
      expect(tracedNamedFn.name).toBe('testFunction');
    });

    it('should handle objects with names', () => {
      const namedObj = { name: 'testObject', value: 42 };
      const tracedNamedObj = traceable('test', namedObj);

      expect(tracedNamedObj['~data'].name).toBe('testObject');
    });

    it('should handle config.showTraceMeta property', () => {
      const obj = helpers.createMockObject();
      const tracedObj = traceable('test', obj);

      // Test that the properties exist
      expect(typeof tracedObj['~data']).toBe('object');
      expect(typeof tracedObj['~meta']).toBe('object');
    });

    it('should support hierarchical tracing with parentId', () => {
      const parentFn = traceable('parent', () => 'parent');
      const childFn = traceable('child', () => 'child', parentFn['~data'].id);

      expect(childFn['~data'].parentId).toBe(parentFn['~data'].id);
      expect(parentFn['~data'].parentId).toBeUndefined();
    });

    it('should emit trace events for function execution', () => {
      const fn = traceable('test', helpers.createMockFunction());
      const result = fn(5);

      expect(result).toBe(10);
      expect(startEvents.length).toBeGreaterThan(0);
      expect(perfEvents.length).toBeGreaterThan(0);
      expect(perfEvents[0].durationMs).toBeGreaterThan(0);
      expect(perfEvents[0].async).toBe(false);
    });

    it('should emit trace events for async function execution', async () => {
      const asyncFn = traceable('async', helpers.createAsyncFunction());
      const result = await asyncFn(5);

      expect(result).toBe(10);
      expect(startEvents.length).toBeGreaterThan(0);
      expect(perfEvents.length).toBeGreaterThan(0);

      expect(perfEvents[0].durationMs).toBeGreaterThan(0);
      expect(perfEvents[0].async).toBe(true);
    });

    it('should emit error events for async function errors', async () => {
      const errorFn = traceable('error-test', helpers.createErrorFunction());

      try {
        await errorFn(-5);
      } catch {
        // Expected to throw
      }

      expect(errorEvents.length).toBeGreaterThan(0);
      expect(errorEvents[0].async).toBe(true);
      expect(errorEvents[0].error.message).toBe('Negative number not allowed');
    });

    it('should handle different types of async errors', async () => {
      // Test with TypeError
      const typeErrorFn = traceable('type-error', async () => {
        throw new TypeError('Type error occurred');
      });

      try {
        await typeErrorFn();
      } catch {
        // Expected to throw
      }

      expect(errorEvents.length).toBeGreaterThan(0);
      expect(errorEvents[0].async).toBe(true);
      expect(errorEvents[0].error.message).toBe('Type error occurred');

      // Test with ReferenceError
      const refErrorFn = traceable('ref-error', async () => {
        throw new ReferenceError('Reference error occurred');
      });

      try {
        await refErrorFn();
      } catch {
        // Expected to throw
      }

      expect(errorEvents.length).toBeGreaterThan(1);
      expect(errorEvents[1].async).toBe(true);
      expect(errorEvents[1].error.message).toBe('Reference error occurred');
    });

    it('should handle tracer.once functionality', () => {
      let onceCalled = false;
      let onCalled = 0;

      // Test once listener
      const onceListener = (data: Any) => {
        onceCalled = true;
        expect(data.durationMs).toBeGreaterThanOrEqual(0);
      };

      // Test on listener
      const onListener = (data: Any) => {
        onCalled++;
        expect(data.durationMs).toBeGreaterThanOrEqual(0);
      };

      tracer.once('perf', onceListener);
      tracer.on('perf', onListener);

      // Execute a traced function
      const fn = traceable('test', (x: number) => x * 2);
      const result = fn(5);

      expect(result).toBe(10);
      expect(onceCalled).toBe(true);
      expect(onCalled).toBe(1);

      // Execute another traced function - once listener should not be called again
      const fn2 = traceable('test2', (x: number) => x + 1);
      const result2 = fn2(10);

      expect(result2).toBe(11);
      expect(onceCalled).toBe(true); // Should still be true, not called again
      expect(onCalled).toBe(2); // Should be called again
    });

    it('should handle tracer.emit functionality', () => {
      const emittedEvents: Any[] = [];

      // Listen to all events
      tracer.on('start', (data) => {
        emittedEvents.push({ type: 'start', data });
      });

      tracer.on('end', (data) => {
        emittedEvents.push({ type: 'end', data });
      });

      tracer.on('perf', (data) => {
        emittedEvents.push({ type: 'perf', data });
      });

      tracer.on('error', (data) => {
        emittedEvents.push({ type: 'error', data });
      });

      // Execute a traced function to trigger events
      const fn = traceable('test', (x: number) => x * 2);
      const result = fn(5);

      expect(result).toBe(10);
      expect(emittedEvents.length).toBeGreaterThan(0);

      // Verify that start, end, and perf events were emitted
      const eventTypes = emittedEvents.map((e) => e.type);
      expect(eventTypes).toContain('start');
      expect(eventTypes).toContain('end');
      expect(eventTypes).toContain('perf');
    });

    it('should correctly parse complex objects and arrays in function inputs and outputs', () => {
      // Function that receives two objects and returns an array
      const complexFn = traceable('complex', (obj1: Any, obj2: Any) => {
        return [obj1, obj2, { combined: true }];
      });

      const input1 = { name: 'test', age: 25, nested: { value: 42 } };
      const input2 = { active: true, tags: ['tag1', 'tag2'] };

      const result = complexFn(input1, input2);

      expect(result).toEqual([input1, input2, { combined: true }]);
      expect(perfEvents.length).toBeGreaterThan(0);

      const perfEvent = perfEvents[0];

      // Validate input parsing
      expect(perfEvent.input).toBeDefined();
      expect(perfEvent.input.type).toBeDefined();
      expect(perfEvent.input.values).toEqual([input1, input2]);

      // Validate output parsing
      expect(perfEvent.output).toBeDefined();
      expect(perfEvent.output.type).toBeDefined();
      expect(perfEvent.output.values).toEqual([input1, input2, { combined: true }]);
    });

    it('should handle null and undefined values in function inputs and outputs', () => {
      const nullUndefinedFn = traceable('null-undefined', (input: Any) => {
        return { received: input, nullValue: null, undefinedValue: undefined };
      });

      const result = nullUndefinedFn('test');

      expect(result).toEqual({ received: 'test', nullValue: null, undefinedValue: undefined });
      expect(perfEvents.length).toBeGreaterThan(0);

      const perfEvent = perfEvents[0];

      // Validate input parsing with null/undefined
      expect(perfEvent.input).toBeDefined();
      expect(perfEvent.input.values).toEqual(['test']);

      // Validate output parsing with null/undefined
      expect(perfEvent.output).toBeDefined();
      expect(perfEvent.output.values).toEqual({
        received: 'test',
        nullValue: null,
        undefinedValue: undefined,
      });
    });

    it('should handle empty objects and arrays in function inputs and outputs', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const emptyFn = traceable('empty', (emptyObj: Any, emptyArr: Any) => {
        return { emptyObject: {}, emptyArray: [] };
      });

      const result = emptyFn({}, []);

      expect(result).toEqual({ emptyObject: {}, emptyArray: [] });
      expect(perfEvents.length).toBeGreaterThan(0);

      const perfEvent = perfEvents[0];

      // Validate input parsing with empty objects/arrays
      expect(perfEvent.input).toBeDefined();
      expect(perfEvent.input.values).toEqual([{}, []]);

      // Validate output parsing with empty objects/arrays
      expect(perfEvent.output).toBeDefined();
      expect(perfEvent.output.values).toEqual({ emptyObject: {}, emptyArray: [] });
    });

    it('should handle primitive types in function inputs and outputs', () => {
      const primitiveFn = traceable('primitive', (str: string, num: number, bool: boolean) => {
        return { string: str, number: num, boolean: bool, symbol: Symbol('test') };
      });

      const result = primitiveFn('test', 42, true);

      expect(result.string).toBe('test');
      expect(result.number).toBe(42);
      expect(result.boolean).toBe(true);
      expect(typeof result.symbol).toBe('symbol');
      expect(perfEvents.length).toBeGreaterThan(0);

      const perfEvent = perfEvents[0];

      // Validate input parsing with primitives
      expect(perfEvent.input).toBeDefined();
      expect(perfEvent.input.values).toEqual(['test', 42, true]);

      // Validate output parsing with primitives
      expect(perfEvent.output).toBeDefined();
      expect(perfEvent.output.values.string).toBe('test');
      expect(perfEvent.output.values.number).toBe(42);
      expect(perfEvent.output.values.boolean).toBe(true);
      expect(typeof perfEvent.output.values.symbol).toBe('symbol');
    });

    it('should handle deeply nested objects and arrays in function inputs and outputs', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const nestedFn = traceable('nested', (nestedObj: Any) => {
        return {
          level1: {
            level2: {
              level3: {
                array: [1, 2, { nested: true }],
                object: { deep: { value: 42 } },
              },
            },
          },
        };
      });

      const input = {
        user: {
          profile: {
            settings: {
              preferences: ['setting1', 'setting2'],
              config: { theme: 'dark', language: 'en' },
            },
          },
        },
      };

      const result = nestedFn(input);

      expect(result.level1.level2.level3.array).toEqual([1, 2, { nested: true }]);
      expect(result.level1.level2.level3.object.deep.value).toBe(42);
      expect(perfEvents.length).toBeGreaterThan(0);

      const perfEvent = perfEvents[0];

      // Validate input parsing with deeply nested objects
      expect(perfEvent.input).toBeDefined();
      expect(perfEvent.input.values).toEqual([input]);

      // Validate output parsing with deeply nested objects
      expect(perfEvent.output).toBeDefined();
      expect(perfEvent.output.values.level1.level2.level3.array).toEqual([1, 2, { nested: true }]);
      expect(perfEvent.output.values.level1.level2.level3.object.deep.value).toBe(42);
    });
  });

  describe('Error handling', () => {
    it('should throw TraceableError when trying to trace already traced element', () => {
      const fn = helpers.createMockFunction();
      const tracedFn = traceable('math', fn);

      expect(() => {
        traceable('math', tracedFn);
      }).toThrow(TraceableError);
    });

    it('should throw TraceableError when trying to trace non-traceable element', () => {
      expect(() => {
        // @ts-expect-error - not traceable.
        traceable('test', 'not traceable');
      }).toThrow();

      // Test with null
      expect(() => {
        // @ts-expect-error - not traceable.
        traceable('test', null);
      }).toThrow();

      // Test with undefined
      expect(() => {
        // @ts-expect-error - not traceable.
        traceable('test', undefined);
      }).toThrow();

      // Test with number
      expect(() => {
        // @ts-expect-error - not traceable.
        traceable('test', 42);
      }).toThrow();

      // Test with boolean
      expect(() => {
        // @ts-expect-error - not traceable.
        traceable('test', true);
      }).toThrow();
    });

    it('should handle TraceableError with correct key and message', () => {
      const fn = helpers.createMockFunction();
      const tracedFn = traceable('math', fn);

      try {
        traceable('math', tracedFn);
      } catch (error) {
        expect(error).toBeInstanceOf(TraceableError);

        if (error instanceof TraceableError) {
          expect(error.key).toBe('TRACEABLE:ALREADY_TRACEABLE');
          expect(error.message).toBe('Element is already traceable');
        }
      }
    });
  });

  describe('Metadata management', () => {
    it('should allow setting metadata properties', () => {
      const obj = helpers.createMockObject();
      const tracedObj = traceable('data', obj)
        .set('name', 'testObject')
        .set('description', 'Test object for tracing')
        .set('scope', 'example')
        .set('doc', 'https://example.com/docs');

      expect(tracedObj['~meta'].name).toBe('testObject');
      expect(tracedObj['~meta'].description).toBe('Test object for tracing');
      expect(tracedObj['~meta'].scope).toBe('example');
      expect(tracedObj['~meta'].doc).toBe('https://example.com/docs');
    });

    it('should update element name when setting name metadata', () => {
      const fn = helpers.createMockFunction();
      const tracedFn = traceable('math', fn).set('name', 'customFunction');

      expect(tracedFn['~data'].name).toBe('customFunction');
      expect(tracedFn['~meta'].name).toBe('customFunction');
    });

    it('should remove set method when all metadata is set', () => {
      const obj = helpers.createMockObject();
      const tracedObj = traceable('data', obj);
      tracedObj.set('name', 'testObject');
      tracedObj.set('description', 'Test object for tracing');
      tracedObj.set('scope', 'example');
      tracedObj.set('doc', 'https://example.com/docs');

      expect(tracedObj.set).toBeUndefined();
    });

    it('should handle set method with different metadata combinations', () => {
      const obj = helpers.createMockObject();
      const tracedObj = traceable('data', obj);

      // Test setting name first
      tracedObj.set('name', 'testObject');
      expect(tracedObj['~meta'].name).toBe('testObject');
      expect(tracedObj['~data'].name).toBe('testObject');

      // Test setting description
      tracedObj.set('description', 'Test description');
      expect(tracedObj['~meta'].description).toBe('Test description');

      // Test setting scope
      tracedObj.set('scope', 'test-scope');
      expect(tracedObj['~meta'].scope).toBe('test-scope');

      // Test setting doc
      tracedObj.set('doc', 'https://test.com');
      expect(tracedObj['~meta'].doc).toBe('https://test.com');

      // After setting all metadata, set method should be removed
      expect(tracedObj.set).toBeUndefined();
    });

    it('should handle set method with partial metadata', () => {
      const obj = helpers.createMockObject();
      const tracedObj = traceable('data', obj);

      // Set only some metadata
      tracedObj.set('name', 'partial');
      tracedObj.set('description', 'partial description');

      // set method should still exist
      expect(tracedObj.set).toBeDefined();

      // Set remaining metadata
      tracedObj.set('scope', 'partial-scope');
      tracedObj.set('doc', 'https://partial.com');

      // Now set method should be removed
      expect(tracedObj.set).toBeUndefined();
    });
  });

  describe('Async function support', () => {
    beforeEach(() => {
      // Reset event collectors for this section
      startEvents = [];
      perfEvents = [];
      errorEvents = [];
    });

    it('should handle async functions correctly', async () => {
      const asyncFn = helpers.createAsyncFunction();
      const tracedAsyncFn = traceable('async', asyncFn);

      const result = await tracedAsyncFn(5);
      expect(result).toBe(10);
    });

    it('should handle async function errors', async () => {
      const errorFn = helpers.createErrorFunction();
      const tracedErrorFn = traceable('error-test', errorFn);

      // Test successful case (no error)
      const result = await tracedErrorFn(5);
      expect(result).toBe(10);

      // Test error case
      try {
        await tracedErrorFn(-5);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect((error as Error).message).toBe('Negative number not allowed');
      }
    });
  });

  describe('Tracer events', () => {
    it('should emit trace events for function execution', () => {
      const fn = traceable('test', helpers.createMockFunction());
      const result = fn(5);

      expect(result).toBe(10);
      expect(startEvents.length).toBeGreaterThan(0);
      expect(perfEvents.length).toBeGreaterThan(0);
      expect(perfEvents[0].durationMs).toBeGreaterThan(0);
      expect(perfEvents[0].async).toBe(false);
    });

    it('should emit error events for sync function execution', () => {
      const fn = traceable('test', helpers.createSyncErrorFunction());

      try {
        fn(-5);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect((error as Error).message).toBe('Negative number not allowed');
      }

      expect(errorEvents.length).toBeGreaterThan(0);
      expect(errorEvents[0].async).toBe(false);
      expect(errorEvents[0].error.message).toBe('Negative number not allowed');
    });

    it('should emit trace events for async function execution', async () => {
      const asyncFn = traceable('async', helpers.createAsyncFunction());
      const result = await asyncFn(5);

      expect(result).toBe(10);
      expect(startEvents.length).toBeGreaterThan(0);
      expect(perfEvents.length).toBeGreaterThan(0);
      expect(perfEvents[0].durationMs).toBeGreaterThan(0);
      expect(perfEvents[0].async).toBe(true);
    });

    it('should emit error events for async function errors', async () => {
      const errorFn = traceable('error-test', helpers.createErrorFunction());

      try {
        await errorFn(-5);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect((error as Error).message).toBe('Negative number not allowed');
      }

      expect(errorEvents.length).toBeGreaterThan(0);
      expect(errorEvents[0].async).toBe(true);
      expect(errorEvents[0].error.message).toBe('Negative number not allowed');
    });

    it('should handle different types of async errors', async () => {
      // Test with TypeError
      const typeErrorFn = traceable('type-error', async () => {
        throw new TypeError('Type error occurred');
      });

      try {
        await typeErrorFn();
      } catch {
        // Expected to throw
      }

      expect(errorEvents.length).toBeGreaterThan(0);
      expect(errorEvents[0].async).toBe(true);
      expect(errorEvents[0].error.message).toBe('Type error occurred');

      // Test with ReferenceError
      const refErrorFn = traceable('ref-error', async () => {
        throw new ReferenceError('Reference error occurred');
      });

      try {
        await refErrorFn();
      } catch {
        // Expected to throw
      }

      expect(errorEvents.length).toBeGreaterThan(1);
      expect(errorEvents[1].async).toBe(true);
      expect(errorEvents[1].error.message).toBe('Reference error occurred');
    });

    it('should handle tracer.once functionality', () => {
      let onceCalled = false;
      let onCalled = 0;

      // Test once listener
      const onceListener = (data: Any) => {
        onceCalled = true;
        expect(data.durationMs).toBeGreaterThanOrEqual(0);
      };

      // Test on listener
      const onListener = (data: Any) => {
        onCalled++;
        expect(data.durationMs).toBeGreaterThanOrEqual(0);
      };

      tracer.once('perf', onceListener);
      tracer.on('perf', onListener);

      // Execute a traced function
      const fn = traceable('test', (x: number) => x * 2);
      const result = fn(5);

      expect(result).toBe(10);
      expect(onceCalled).toBe(true);
      expect(onCalled).toBe(1);

      // Execute another traced function - once listener should not be called again
      const fn2 = traceable('test2', (x: number) => x + 1);
      const result2 = fn2(10);

      expect(result2).toBe(11);
      expect(onceCalled).toBe(true); // Should still be true, not called again
      expect(onCalled).toBe(2); // Should be called again
    });

    it('should handle tracer.emit functionality', () => {
      const emittedEvents: Any[] = [];

      // Listen to all events
      tracer.on('start', (data) => {
        emittedEvents.push({ type: 'start', data });
      });

      tracer.on('end', (data) => {
        emittedEvents.push({ type: 'end', data });
      });

      tracer.on('perf', (data) => {
        emittedEvents.push({ type: 'perf', data });
      });

      tracer.on('error', (data) => {
        emittedEvents.push({ type: 'error', data });
      });

      // Execute a traced function to trigger events
      const fn = traceable('test', (x: number) => x * 2);
      const result = fn(5);

      expect(result).toBe(10);
      expect(emittedEvents.length).toBeGreaterThan(0);

      // Verify that start, end, and perf events were emitted
      const eventTypes = emittedEvents.map((e) => e.type);
      expect(eventTypes).toContain('start');
      expect(eventTypes).toContain('end');
      expect(eventTypes).toContain('perf');
    });

    it('should correctly parse complex objects and arrays in function inputs and outputs', () => {
      // Function that receives two objects and returns an array
      const complexFn = traceable('complex', (obj1: Any, obj2: Any) => {
        return [obj1, obj2, { combined: true }];
      });

      const input1 = { name: 'test', age: 25, nested: { value: 42 } };
      const input2 = { active: true, tags: ['tag1', 'tag2'] };

      const result = complexFn(input1, input2);

      expect(result).toEqual([input1, input2, { combined: true }]);
      expect(perfEvents.length).toBeGreaterThan(0);

      const perfEvent = perfEvents[0];

      // Validate input parsing
      expect(perfEvent.input).toBeDefined();
      expect(perfEvent.input.type).toBeDefined();
      expect(perfEvent.input.values).toEqual([input1, input2]);

      // Validate output parsing
      expect(perfEvent.output).toBeDefined();
      expect(perfEvent.output.type).toBeDefined();
      expect(perfEvent.output.values).toEqual([input1, input2, { combined: true }]);
    });

    it('should handle null and undefined values in function inputs and outputs', () => {
      const nullUndefinedFn = traceable('null-undefined', (input: Any) => {
        return { received: input, nullValue: null, undefinedValue: undefined };
      });

      const result = nullUndefinedFn('test');

      expect(result).toEqual({ received: 'test', nullValue: null, undefinedValue: undefined });
      expect(perfEvents.length).toBeGreaterThan(0);

      const perfEvent = perfEvents[0];

      // Validate input parsing with null/undefined
      expect(perfEvent.input).toBeDefined();
      expect(perfEvent.input.values).toEqual(['test']);

      // Validate output parsing with null/undefined
      expect(perfEvent.output).toBeDefined();
      expect(perfEvent.output.values).toEqual({
        received: 'test',
        nullValue: null,
        undefinedValue: undefined,
      });
    });

    it('should handle empty objects and arrays in function inputs and outputs', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const emptyFn = traceable('empty', (emptyObj: Any, emptyArr: Any) => {
        return { emptyObject: {}, emptyArray: [] };
      });

      const result = emptyFn({}, []);

      expect(result).toEqual({ emptyObject: {}, emptyArray: [] });
      expect(perfEvents.length).toBeGreaterThan(0);

      const perfEvent = perfEvents[0];

      // Validate input parsing with empty objects/arrays
      expect(perfEvent.input).toBeDefined();
      expect(perfEvent.input.values).toEqual([{}, []]);

      // Validate output parsing with empty objects/arrays
      expect(perfEvent.output).toBeDefined();
      expect(perfEvent.output.values).toEqual({ emptyObject: {}, emptyArray: [] });
    });

    it('should handle primitive types in function inputs and outputs', () => {
      const primitiveFn = traceable('primitive', (str: string, num: number, bool: boolean) => {
        return { string: str, number: num, boolean: bool, symbol: Symbol('test') };
      });

      const result = primitiveFn('test', 42, true);

      expect(result.string).toBe('test');
      expect(result.number).toBe(42);
      expect(result.boolean).toBe(true);
      expect(typeof result.symbol).toBe('symbol');
      expect(perfEvents.length).toBeGreaterThan(0);

      const perfEvent = perfEvents[0];

      // Validate input parsing with primitives
      expect(perfEvent.input).toBeDefined();
      expect(perfEvent.input.values).toEqual(['test', 42, true]);

      // Validate output parsing with primitives
      expect(perfEvent.output).toBeDefined();
      expect(perfEvent.output.values.string).toBe('test');
      expect(perfEvent.output.values.number).toBe(42);
      expect(perfEvent.output.values.boolean).toBe(true);
      expect(typeof perfEvent.output.values.symbol).toBe('symbol');
    });

    it('should handle deeply nested objects and arrays in function inputs and outputs', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const nestedFn = traceable('nested', (nestedObj: Any) => {
        return {
          level1: {
            level2: {
              level3: {
                array: [1, 2, { nested: true }],
                object: { deep: { value: 42 } },
              },
            },
          },
        };
      });

      const input = {
        user: {
          profile: {
            settings: {
              preferences: ['setting1', 'setting2'],
              config: { theme: 'dark', language: 'en' },
            },
          },
        },
      };

      const result = nestedFn(input);

      expect(result.level1.level2.level3.array).toEqual([1, 2, { nested: true }]);
      expect(result.level1.level2.level3.object.deep.value).toBe(42);
      expect(perfEvents.length).toBeGreaterThan(0);

      const perfEvent = perfEvents[0];

      // Validate input parsing with deeply nested objects
      expect(perfEvent.input).toBeDefined();
      expect(perfEvent.input.values).toEqual([input]);

      // Validate output parsing with deeply nested objects
      expect(perfEvent.output).toBeDefined();
      expect(perfEvent.output.values.level1.level2.level3.array).toEqual([1, 2, { nested: true }]);
      expect(perfEvent.output.values.level1.level2.level3.object.deep.value).toBe(42);
    });
  });

  describe('Type safety', () => {
    it('should provide correct type inference for all public elements', () => {
      // Test isTraceable function
      expectTypeOf(isTraceable).toBeFunction();
      expectTypeOf(isTraceable({})).toBeBoolean();

      // Test traceable function
      expectTypeOf(traceable).toBeFunction();
      expectTypeOf(traceable('test', () => 'test')).toBeObject();

      // Test tracer object
      expectTypeOf(tracer).toBeObject();
      expectTypeOf(tracer.emit).toBeFunction();
      expectTypeOf(tracer.on).toBeFunction();
      expectTypeOf(tracer.once).toBeFunction();
    });

    it('should validate generic type constraints', () => {
      // Test traceable with different element types
      const fn = () => 'test';
      const obj = { value: 42 };

      expectTypeOf(traceable('test', fn)).toBeObject();
      expectTypeOf(traceable('test', obj)).toBeObject();

      // Test isTraceable with different input types
      expectTypeOf(isTraceable(fn)).toBeBoolean();
      expectTypeOf(isTraceable(obj)).toBeBoolean();
      expectTypeOf(isTraceable(null)).toBeBoolean();
      expectTypeOf(isTraceable(undefined)).toBeBoolean();
    });

    it('should validate traceable element properties', () => {
      const fn = () => 'test';
      const tracedFn = traceable('test', fn);

      // Test trace data structure
      expectTypeOf(tracedFn['~data']).toBeObject();
      expectTypeOf(tracedFn['~data'].id).toBeString();
      expectTypeOf(tracedFn['~data'].tag).toBeString();
      expectTypeOf(tracedFn['~data'].type).toBeString();
      expectTypeOf(tracedFn['~data'].name).toBeString();

      // Test trace metadata structure
      expectTypeOf(tracedFn['~meta']).toBeObject();
    });

    it('should validate tracer event types', () => {
      // Test tracer event emission
      expectTypeOf(tracer.emit).toBeFunction();

      // Test tracer event subscription
      expectTypeOf(tracer.on).toBeFunction();

      // Test tracer once subscription
      expectTypeOf(tracer.once).toBeFunction();
    });
  });

  describe('Code examples', () => {
    it('should run example trace-001: Basic error handling', () => {
      try {
        const fn = () => 'test';
        const tracedFn = traceable('test', fn);
        traceable('test', tracedFn); // This will throw
      } catch (error) {
        expect(error).toBeInstanceOf(TraceableError);
        if (error instanceof TraceableError) {
          expect(error.key).toBe('TRACEABLE:ALREADY_TRACEABLE');
          expect(error.message).toBe('Element is already traceable');
        }
      }
    });

    it('should run example trace-002: Check if element is traceable', () => {
      const fn = () => 'test';
      const tracedFn = traceable('test', fn);

      const isTraced = isTraceable(tracedFn);
      expect(isTraced).toBe(true);

      const isNotTraced = isTraceable(fn);
      expect(isNotTraced).toBe(false);
    });

    it('should run example trace-003: Basic function tracing', () => {
      const fn = (x: number) => x * 2;
      const tracedFn = traceable('math', fn);

      const result = tracedFn(5);
      expect(result).toBe(10);
      expect(tracedFn.name).toBe('fn');
    });

    it('should run example trace-004: Object tracing with metadata', () => {
      const obj = { value: 42 };
      const tracedObj = traceable('data', obj)
        .set('name', 'testObject')
        .set('description', 'Test object for tracing')
        .set('scope', 'example')
        .set('doc', 'https://example.com/docs');

      expect(tracedObj.value).toBe(42);
      expect(tracedObj['~meta'].name).toBe('testObject');
      expect(tracedObj['~meta'].description).toBe('Test object for tracing');
      expect(tracedObj['~meta'].scope).toBe('example');
      expect(tracedObj['~meta'].doc).toBe('https://example.com/docs');
    });

    it('should run example trace-005: Hierarchical tracing with parentId', () => {
      const parentFn = traceable('parent', () => 'parent');
      const childFn = traceable('child', () => 'child', parentFn['~data'].id);

      expect(parentFn['~data'].id).toBeDefined();
      expect(childFn['~data'].id).toBeDefined();
      expect(childFn['~data'].parentId).toBe(parentFn['~data'].id);
    });

    it('should run example trace-006: Emit custom trace event', () => {
      tracer.emit('perf', {
        durationMs: 150,
        start: process.hrtime.bigint(),
        end: process.hrtime.bigint(),
        input: { type: 'number', values: [5] },
        output: { type: 'number', values: 10 },
        meta: { name: 'test' },
        async: false,
      });

      // No assertion needed - just testing that emit works
      expect(true).toBe(true);
    });

    it('should run example trace-007: Subscribe to trace events', () => {
      let startCalled = false;
      let perfCalled = false;

      const startListener = (data: { input: unknown }) => {
        startCalled = true;
        expect(data.input).toBeDefined();
      };

      const perfListener = (data: { durationMs: number; async?: boolean }) => {
        perfCalled = true;
        expect(data.durationMs).toBeGreaterThanOrEqual(0);
        if (data.async) {
          expect(data.async).toBe(true);
        }
      };

      tracer.on('start', startListener);
      tracer.on('perf', perfListener);

      const fn = traceable('test', (x: number) => x + 1);
      const result = fn(10);

      expect(result).toBe(11);
      expect(startCalled).toBe(true);
      expect(perfCalled).toBe(true);
    });

    it('should run example trace-008: Subscribe to trace events once', () => {
      let onceCalled = false;

      const onceListener = (data: { durationMs: number }) => {
        onceCalled = true;
        expect(data.durationMs).toBeGreaterThanOrEqual(0);
      };

      tracer.once('perf', onceListener);

      const fn = traceable('test', (x: number) => x * 2);
      fn(5); // This will trigger the once listener.
      fn(10); // This will NOT trigger the once listener.

      expect(onceCalled).toBe(true);
    });

    it('should run example trace-009: Tracer event subscription', () => {
      let startCalled = false;
      let perfCalled = false;
      let errorCalled = false;

      const startListener = (data: { input: unknown }) => {
        startCalled = true;
        expect(data.input).toBeDefined();
      };

      const perfListener = (data: { durationMs: number; async?: boolean }) => {
        perfCalled = true;
        expect(data.durationMs).toBeGreaterThanOrEqual(0);
        if (data.async) {
          expect(data.async).toBe(true);
        }
      };

      const errorListener = (data: { error: Error; async?: boolean }) => {
        errorCalled = true;
        expect(data.error).toBeDefined();
        if (data.async) {
          expect(data.async).toBe(true);
        }
      };

      tracer.on('start', startListener);
      tracer.on('perf', perfListener);
      tracer.on('error', errorListener);

      const fn = traceable('test', (x: number) => x + 1);
      const result = fn(10);

      expect(result).toBe(11);
      expect(startCalled).toBe(true);
      expect(perfCalled).toBe(true);
      // errorCalled will be false since no error occurred
      expect(errorCalled).toBe(false);
    });

    it('should run example trace-010: Async function tracing', async () => {
      const asyncFn = async (x: number) => {
        await setTimeout(100);
        return x * 2;
      };
      const tracedAsyncFn = traceable('async', asyncFn);

      const result = await tracedAsyncFn(5);
      expect(result).toBe(10);
    });

    it('should run example trace-011: Async function with error handling', async () => {
      const asyncFn = traceable('async', async (x: number) => {
        if (x < 0) throw new Error('Negative number');
        return x * 2;
      });

      try {
        const result = await asyncFn(5);
        expect(result).toBe(10);
      } catch (error) {
        expect((error as Error).message).toBe('Negative number');
      }
    });
  });
});
