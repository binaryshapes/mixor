/*
 * This file is part of the Mixor project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { randomUUID } from 'node:crypto';
import { EventEmitter } from 'node:events';

import { config } from './config';
import type { Any, Prettify } from './generics';
import { Panic } from './panic';

/**
 * Trace data structure containing identification and metadata.
 *
 * @param Tag - The tag identifier for the trace.
 *
 * @internal
 */
type TraceData<Tag extends string> = {
  /** Unique identifier for the trace. */
  id: string;
  /** Parent trace identifier for hierarchical tracing. */
  parentId?: string;
  /** Type of the traced element. */
  type: 'function' | 'object' | 'primitive';
  /** Tag identifier for categorization. */
  tag: Tag;
  /** Name of the traced element. */
  name: string;
};

/**
 * Trace metadata for documentation and context.
 *
 * @internal
 */
type TraceMeta = {
  /** Human-readable name of the traced element. */
  name: string;
  /** Description of the element's purpose. */
  description: string;
  /** Scope or context where the element is used. */
  scope: string;
  /** Documentation URL or reference. */
  doc: string;
};

/**
 * Base trace structure that extends any type with trace data.
 *
 * @param Tag - The tag identifier for the trace.
 * @param T - The original type to be traced.
 *
 * @internal
 */
type Trace<Tag extends string, T> = T & {
  /** Trace data containing identification and metadata. */
  readonly '~data': TraceData<Tag>;
  /** Trace metadata for documentation. */
  readonly '~meta': TraceMeta;
};

/**
 * Function type that can be traced (sync or async).
 *
 * @internal
 */
type TraceableFunction = (...args: Any) => Any | Promise<Any>;

/**
 * Element types that can be traced (functions or objects).
 *
 * @internal
 */
type TraceableElement = TraceableFunction | Record<string, Any>;

/**
 * Traceable element with metadata setting capabilities.
 *
 * @param Tag - The tag identifier for the trace.
 * @param T - The original type to be traced.
 * @param List - The remaining metadata properties to set.
 *
 * @internal
 */
type Traceable<Tag extends string, T, List = TraceMeta> = Trace<Tag, T> & {
  /**
   * Set metadata property and return updated traceable element.
   *
   * @param key - The metadata property to set.
   * @param value - The value to assign.
   * @returns Updated traceable element or final trace if all metadata is set.
   */
  set<K extends keyof List>(
    key: K,
    value: List[K],
  ): Omit<List, K> extends Record<string, never>
    ? Trace<Tag, T>
    : Traceable<Tag, T, Prettify<Omit<List, K>>>;
};

/**
 * Parse an object to extract type information for tracing.
 *
 * This function analyzes objects and arrays to extract type information
 * without exposing sensitive data. It returns type information for
 * primitive values and object structures.
 *
 * @param obj - The object to parse.
 * @returns The parsed object with type information.
 *
 * @internal
 */
const parseObject = (obj: Any): Any => {
  if (!!obj && typeof obj === 'object' && !Array.isArray(obj)) {
    return Object.keys(obj).reduce(
      (acc, key) => ({
        ...acc,
        [key]: typeof obj[key] === 'object' ? parseObject(obj[key]) : typeof obj[key],
      }),
      {} as Record<string, string>,
    );
  }

  if (Array.isArray(obj)) {
    return obj.map((arg) => (typeof arg === 'object' ? parseObject(arg) : typeof arg));
  }

  return typeof obj;
};

/**
 * Wrap a function to make it traceable with performance monitoring.
 *
 * This function creates a wrapper around the original function that:
 * - Captures input and output data
 * - Measures execution time
 * - Emits trace events for monitoring
 * - Preserves the original function's behavior
 * - Handles both synchronous and asynchronous functions
 *
 * @param fn - The function to wrap.
 * @returns The wrapped function with tracing capabilities.
 *
 * @internal
 */
function makeTraceable<Tag extends string, T extends TraceableElement>(fn: T) {
  const wrapped: Traceable<Tag, T> = function (...args: Any[]) {
    const input = { type: parseObject(args), values: args };
    const start = process.hrtime.bigint();

    tracer.emit('start', { start, input });

    const emitPerf = (end: bigint, output: Any, isAsync: boolean) => {
      tracer.emit('end', { end, output });
      tracer.emit('perf', {
        durationMs: Number(end - start) / 1_000_000,
        start,
        end,
        input,
        output,
        meta: wrapped['~meta'],
        async: isAsync,
      });
    };

    const emitError = (end: bigint, error: Error, isAsync: boolean) => {
      tracer.emit('error', {
        error,
        durationMs: Number(end - start) / 1_000_000,
        start,
        end,
        input,
        meta: wrapped['~meta'],
        async: isAsync,
      });
    };

    try {
      // Execute the original function.
      const result = (fn as Any)(...args);

      if (result instanceof Promise) {
        return result
          .then((resolvedValue) => {
            emitPerf(
              process.hrtime.bigint(),
              { type: parseObject(resolvedValue), values: resolvedValue },
              true,
            );
            return resolvedValue;
          })
          .catch((error) => {
            emitError(process.hrtime.bigint(), error, true);
            throw error;
          });
      } else {
        emitPerf(process.hrtime.bigint(), { type: parseObject(result), values: result }, false);
        return result;
      }
    } catch (error) {
      emitError(process.hrtime.bigint(), error as Error, false);
      throw error;
    }
  } as Traceable<Tag, T>;

  Object.defineProperty(wrapped, 'name', {
    value: fn.name,
    writable: false,
    enumerable: false,
  });

  return wrapped;
}

/**
 * Global tracer for emitting and subscribing to trace events.
 *
 * The tracer provides a centralized event system for trace monitoring.
 * It emits four types of events:
 * - `start`: When a traced function begins execution
 * - `end`: When a traced function completes execution
 * - `perf`: Performance metrics with duration and metadata
 * - `error`: When errors occur during tracing (especially for async functions)
 *
 * For async functions, the tracer provides additional context:
 * - `async: true` flag in perf events
 * - Error events with async context
 * - Proper timing for Promise resolution
 *
 * @example
 * ```ts
 * // trace-009: Tracer event subscription.
 * tracer.on('start', (data) => {
 *   console.log('Function started:', data.input);
 * });
 *
 * tracer.on('perf', (data) => {
 *   console.log(`Duration: ${data.durationMs}ms`);
 *   if (data.async) {
 *     console.log('Async function completed');
 *   }
 * });
 *
 * tracer.on('error', (data) => {
 *   console.log('Error occurred:', data.error);
 *   if (data.async) {
 *     console.log('Async function error');
 *   }
 * });
 * ```
 *
 * @public
 */
const tracer = (() => {
  type TracerEvents = 'start' | 'end' | 'error' | 'perf';

  const tracer = new EventEmitter();

  return {
    /**
     * Emit a trace event with data.
     *
     * @param event - The event type to emit.
     * @param data - The data to include with the event.
     *
     * @example
     * ```ts
     * // trace-006: Emit custom trace event.
     * tracer.emit('perf', {
     *   durationMs: 150,
     *   start: process.hrtime.bigint(),
     *   end: process.hrtime.bigint(),
     *   input: { type: 'number', values: [5] },
     *   output: { type: 'number', values: 10 },
     *   meta: { name: 'test' },
     *   async: false
     * });
     * ```
     *
     * @public
     */
    emit: (event: TracerEvents, data: Any) => {
      tracer.emit(event, data);
    },

    /**
     * Subscribe to trace events.
     *
     * @param event - The event type to listen for.
     * @param listener - The callback function to execute.
     *
     * @example
     * ```ts
     * // trace-007: Subscribe to trace events.
     * tracer.on('start', (data) => {
     *   console.log('Function started:', data.input);
     * });
     *
     * tracer.on('perf', (data) => {
     *   console.log(`Duration: ${data.durationMs}ms`);
     *   if (data.async) {
     *     console.log('Async function completed');
     *   }
     * });
     * ```
     *
     * @public
     */
    on: (event: TracerEvents, listener: (...args: Any[]) => void) => {
      tracer.on(event, listener);
    },

    /**
     * Subscribe to trace events once.
     *
     * @param event - The event type to listen for.
     * @param listener - The callback function to execute.
     *
     * @example
     * ```ts
     * // trace-008: Subscribe to trace events once.
     * tracer.once('perf', (data) => {
     *   console.log(`First function took ${data.durationMs}ms`);
     * });
     *
     * const fn = traceable('test', (x: number) => x * 2);
     * fn(5); // This will trigger the once listener.
     * fn(10); // This will NOT trigger the once listener.
     * ```
     *
     * @public
     */
    once: (event: TracerEvents, listener: (...args: Any[]) => void) => {
      tracer.once(event, listener);
    },
  };
})();

/**
 * Trace module error.
 *
 * @param tag - The tag of the error.
 * @param message - The error message.
 * @returns The error.
 *
 * @example
 * ```ts
 * // trace-001: Basic error handling.
 * try {
 *   const result = traceable('test', someFunction);
 * } catch (error) {
 *   if (error instanceof TraceableError) {
 *     // Handle traceable error.
 *   }
 * }
 * ```
 *
 * @public
 */
const TraceableError = Panic<
  'TRACEABLE',
  // Raised when the traceable configuration already exists in a element.
  | 'ALREADY_TRACEABLE'
  // Raised when the traceable configuration does not exist in a element.
  | 'NOT_TRACEABLE'
>('TRACEABLE');

/**
 * Check if an element is traceable.
 *
 * @param element - The element to check.
 * @returns True if the element is traceable, false otherwise.
 *
 * @example
 * ```ts
 * // trace-002: Check if element is traceable.
 * const fn = () => 'test';
 * const tracedFn = traceable('test', fn);
 *
 * const isTraced = isTraceable(tracedFn);
 * // isTraced: true.
 *
 * const isNotTraced = isTraceable(fn);
 * // isNotTraced: false.
 * ```
 *
 * @public
 */
const isTraceable = (element: Any): boolean =>
  !!element && '~data' in element && '~meta' in element;

/**
 * Make an element traceable.
 *
 * @param tag - The tag of the object.
 * @param element - The element to trace.
 * @param parentId - The parent id of the element.
 * @returns The traced element.
 *
 * @example
 * ```ts
 * // trace-003: Basic function tracing.
 * const fn = (x: number) => x * 2;
 * const tracedFn = traceable('math', fn);
 *
 * const result = tracedFn(5);
 * // result: 10.
 * ```
 *
 * @example
 * ```ts
 * // trace-004: Object tracing with metadata.
 * const obj = { value: 42 };
 * const tracedObj = traceable('data', obj)
 *   .set('name', 'testObject')
 *   .set('description', 'Test object for tracing')
 *   .set('scope', 'example')
 *   .set('doc', 'https://example.com/docs');
 * ```
 *
 * @example
 * ```ts
 * // trace-005: Hierarchical tracing with parentId.
 * const parentFn = traceable('parent', () => 'parent');
 * const childFn = traceable('child', () => 'child', parentFn['~data'].id);
 * ```
 *
 * @example
 * ```ts
 * // trace-010: Async function tracing.
 * const asyncFn = async (x: number) => {
 *   await setTimeout(100);
 *   return x * 2;
 * };
 * const tracedAsyncFn = traceable('async', asyncFn);
 *
 * const result = await tracedAsyncFn(5);
 * // result: 10.
 * ```
 *
 * @example
 * ```ts
 * // trace-011: Async function with error handling.
 * const asyncFn = traceable('async', async (x: number) => {
 *   if (x < 0) throw new Error('Negative number');
 *   return x * 2;
 * });
 *
 * try {
 *   const result = await asyncFn(5);
 *   // result: 10.
 * } catch (error) {
 *   // Handle error.
 * }
 * ```
 *
 * @public
 */
const traceable = <Tag extends string, T extends TraceableElement>(
  tag: Tag,
  element: T,
  parentId?: string,
): Traceable<Tag, T, TraceMeta> => {
  if (isTraceable(element)) {
    throw new TraceableError('ALREADY_TRACEABLE', 'Element is already traceable');
  }

  let traceableElement: Traceable<Tag, T, TraceMeta> | T;

  // If the element is a function, wrap it with the traceable function.
  if (typeof element === 'function') {
    traceableElement = makeTraceable<Tag, T>(element);
  } else if (typeof element === 'object') {
    traceableElement = element;
  } else {
    throw new TraceableError('NOT_TRACEABLE', 'Element is not traceable');
  }

  const name = traceableElement.name || 'anonymous';
  const id = randomUUID();
  const meta: Partial<TraceMeta> = {};

  Object.defineProperties(traceableElement, {
    '~data': {
      value: {
        id,
        parentId,
        type: typeof traceableElement,
        tag,
        name,
      },
      writable: false,
      enumerable: config.showTraceMeta,
      configurable: false,
    },
    '~meta': {
      value: meta,
      writable: true,
      enumerable: config.showTraceMeta,
      configurable: false,
    },
    set: {
      value: (key: keyof TraceMeta, value: string) => {
        // Override the name of the element.
        if (key === 'name') {
          (traceableElement as Any)['~data'].name = value;
        }

        meta[key] = value;

        // If all metadata already have a value,
        // we delete the set method to avoid further modifications.
        if (
          Object.keys(meta).length === 4 &&
          Object.keys(meta).includes('name') &&
          Object.keys(meta).includes('scope') &&
          Object.keys(meta).includes('description') &&
          Object.keys(meta).includes('doc') &&
          Object.values(meta).every((value) => !!value)
        ) {
          Reflect.deleteProperty(traceableElement, 'set');
        }

        return traceableElement;
      },
      writable: true,
      enumerable: config.showTraceMeta,
      configurable: true,
    },
  });

  return traceableElement as Traceable<Tag, T>;
};

export { traceable, tracer, isTraceable, TraceableError };
