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

import { config } from './_config';
import { hash } from './_hash';
import type { Infer } from './_infer';
import type { Any, Prettify } from './generics';
import { Panic } from './panic';

/**
 * The maximum number of listeners for the tracer.
 *
 * @internal
 */
const MAX_LISTENERS = config.tracerMaxListeners;

/**
 * Trace module error.
 *
 * @param tag - The tag of the error.
 * @param message - The error message.
 * @returns The error.
 *
 * @public
 */
const TraceableError = Panic<
  'TRACEABLE',
  // Raised when the traceable configuration already exists in a element.
  | 'ALREADY_TRACEABLE'
  // Raised when the traceable configuration does not exist in a element.
  | 'NOT_TRACEABLE'
  // Raised when the traceable element is not a function.
  | 'NOT_FUNCTION'
  // Raised when the traceable element is already traced.
  | 'ALREADY_TRACED'
>('TRACEABLE');

/**
 * Represents the metadata for a traceable element. It could be extended with additional metadata.
 *
 * @typeParam Meta - The additional metadata for the trace.
 *
 * @public
 */
type TraceableMeta<Meta extends Record<string, Any> = object> = Prettify<
  {
    /** Human-readable name of the traced element. */
    name: string;
    /** Description of the element's purpose. */
    description: string;
    /** Scope or context where the element is used. */
    scope: string;
  } & Meta
>;

/**
 * Represents a traceable element. It could be a function or an object.
 *
 * @typeParam Tag - The tag identifier for the trace.
 * @typeParam Type - The type of the traced element.
 * @typeParam Meta - The additional metadata for the trace.
 *
 * @public
 */
type Traceable<
  Tag extends string,
  Type,
  Meta extends Record<string, Any> = TraceableMeta,
> = Type & {
  /** The type of the traced element. */
  Type: Infer<Type, Tag>;

  /**
   * Set the metadata for the traceable element.
   *
   * @param meta - The metadata to set.
   * @returns The traceable element.
   */
  meta: (meta: TraceableMeta<Meta>) => Traceable<Tag, Type, Meta>;

  /**
   * Set the parent of the traceable element.
   *
   * @param parent - The parent traceable element.
   * @returns The traceable element.
   */
  parent: (parent: Traceable<Any, Any, Any>) => Traceable<Tag, Type, Meta>;

  /**
   * Enable tracing for the element.
   *
   * @returns The traced element.
   */
  trace: () => Traceable<Tag, Type, Meta>;

  /** Trace internal data. */
  readonly '~trace': {
    /** Unique identifier for the trace. */
    id: string;
    /** Parent trace identifier for hierarchical tracing. */
    parentId?: string | undefined;
    /** Type of the traced element. */
    type: 'function' | 'object' | 'primitive';
    /** Tag identifier for categorization. */
    tag: Tag;
    /** Name of the traced element. */
    name: string;
    /** Indicates if the traced element is traceable. */
    traced: boolean;
    /** Hash value of the traceable element. */
    hash: string;
    /** Metadata for the traced element. */
    meta: TraceableMeta<Meta>;
  };
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
function trace<T extends Traceable<Any, Any, Any>>(fn: T): T {
  if (typeof fn !== 'function') {
    throw new TraceableError('NOT_FUNCTION', 'Cannot trace non-function elements');
  }

  if ((fn as Any)['~trace'].traced) {
    throw new TraceableError('ALREADY_TRACED', 'Element is already traced');
  }

  const wrapped = function (...args: Any[]) {
    const input = { type: parseObject(args), values: args };
    const start = process.hrtime.bigint();
    const traceId = randomUUID();
    const elementId = (fn as Any)['~trace'].id;

    tracer.emit('start', { traceId, elementId, start, input });

    const emitPerf = (end: bigint, output: Any, isAsync: boolean) => {
      tracer.emit('end', { end, output });
      tracer.emit('perf', {
        traceId,
        elementId,
        durationMs: Number(end - start) / 1_000_000,
        start,
        end,
        input,
        output,
        async: isAsync,
      });
    };

    const emitError = (end: bigint, error: Error, isAsync: boolean) => {
      tracer.emit('error', {
        traceId,
        elementId,
        error,
        durationMs: Number(end - start) / 1_000_000,
        start,
        end,
        input,
        async: isAsync,
        trace: (fn as Any)['~trace'],
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
  };

  // Keep the original name of the function.
  Object.defineProperty(wrapped, 'name', {
    value: (fn as Any).name,
    writable: false,
    enumerable: false,
  });

  return wrapped as T;
}

/**
 * Makes an element traceable by attaching tracing capabilities to it.
 *
 * This function transforms any function or object into a traceable element
 * that can be monitored for performance and execution details. The element
 * gains additional methods for metadata management and parent-child relationships.
 *
 * @typeParam Tag - The tag identifier for the trace.
 * @typeParam T - The type of the element to make traceable.
 * @typeParam Meta - The additional metadata for the trace.
 * @param tag - The tag identifier for categorization.
 * @param element - The element to make traceable.
 * @returns The traceable element with additional capabilities.
 *
 * @example
 * ```ts
 * // trace-001: Basic function tracing.
 * const add = (a: number, b: number) => a + b;
 * const traceableAdd = traceable('math', add);
 *
 * const result = traceableAdd(5, 3);
 * // result: 8.
 * ```
 *
 * @example
 * ```ts
 * // trace-002: Object tracing with metadata.
 * const userService = {
 *   getUser: (id: string) => ({ id, name: 'John' }),
 *   updateUser: (id: string, data: Any) => ({ id, ...data }),
 * };
 *
 * const traceableService = traceable('Service', userService).meta({
 *   scope: 'Authentication',
 *   name: 'UserService',
 *   description: 'User management operations',
 * });
 *
 * const user = traceableService.getUser('123');
 * // user: { id: '123', name: 'John' }.
 * ```
 *
 * @example
 * ```ts
 * // trace-003: Async function tracing.
 * const asyncOperation = async (data: string) => {
 *   await new Promise(resolve => setTimeout(resolve, 100));
 *   return `Processed: ${data}`;
 * };
 *
 * const traceableAsync = traceable('async', asyncOperation);
 * const result = await traceableAsync('test');
 * // result: 'Processed: test'.
 * ```
 *
 * @public
 */
const traceable = <Tag extends string, T, Meta extends Record<string, Any> = TraceableMeta>(
  tag: Tag,
  element: T,
) => {
  if (isTraceable(element)) {
    throw new TraceableError('ALREADY_TRACEABLE', 'Element is already traceable');
  }

  // Define the element internal trace data.
  const traceMeta = {
    id: randomUUID(),
    parentId: undefined,
    type: typeof element === 'function' ? 'function' : 'object',
    tag,
    traced: false,
    hash: hash(element, tag),
    name: (element as Any).name || 'anonymous',
    meta: {} as TraceableMeta<Meta>,
  };

  // Attach the trace data to the element (initialization).
  Object.defineProperty(element, '~trace', {
    value: traceMeta,
    writable: false,
    enumerable: config.showTraceMeta,
    configurable: false,
  });

  // Generates the autoTrace property.
  Object.defineProperty(element, 'trace', {
    value: () => {
      const traced = Object.assign(trace(element) as Any, element as Any);
      traced['~trace'].traced = true;
      return traced;
    },
    writable: false,
    enumerable: config.showTraceMeta,
  });

  // Generates the meta property.
  Object.defineProperty(element, 'meta', {
    value: (meta: TraceableMeta<Any>) => {
      // Override the metadata.
      (element as Any)['~trace'].meta = meta;

      return element;
    },
    writable: false,
    enumerable: config.showTraceMeta,
  });

  // Generates the parent property.
  Object.defineProperty(element, 'parent', {
    value: (parent: Traceable<Any, Any, Any>) => {
      if (!isTraceable(parent)) {
        throw new TraceableError('NOT_TRACEABLE', 'Parent is not traceable');
      }

      // Set the parent id.
      (element as Any)['~trace'].parentId = parent['~trace'].id;
      return element;
    },
    writable: false,
    enumerable: config.showTraceMeta,
  });

  // Defining the type of the element as a getter.
  Object.defineProperty(element, 'Type', {
    get: () => element as T,
    enumerable: false,
    configurable: false,
  });

  return element as Traceable<Tag, T, Meta>;
};

/**
 * Check if an element is traceable.
 *
 * @param element - The element to check.
 * @returns True if the element is traceable, false otherwise.
 *
 * @example
 * ```ts
 * // trace-004: Check if element is traceable.
 * const fn = () => 'test';
 * const tracedFn = traceable('test', () => 'test');
 *
 * const isTraceable = isTraceable(tracedFn);
 * // isTraceable: true.
 *
 * const isNotTraceable = isTraceable(fn);
 * // isNotTraceable: false.
 * ```
 *
 * @public
 */
const isTraceable = (element: Any): boolean =>
  !!element &&
  // Only objects and functions can be traceable.
  (typeof element === 'object' || typeof element === 'function') &&
  '~trace' in element;

/**
 * Check if an element is traced which means it has been wrapped by the trace function.
 *
 * @param element - The element to check.
 * @returns True if the element is traced, false otherwise.
 *
 * @example
 * ```ts
 * // trace-005: Check if element is traced.
 * const traceableFn = traceable('test', () => 'test');
 * const tracedFn = traceable('test', () => 'test').trace();
 *
 * const isTraced = isTraced(tracedFn);
 * // isTraced: true.
 *
 * const isNotTraced = isTraced(traceableFn);
 * // isNotTraced: false.
 * ```
 *
 * @public
 */
const isTraced = (element: Any): boolean =>
  isTraceable(element) &&
  // Only functions can be traced.
  typeof element === 'function' &&
  !!(element as Any)['~trace'] &&
  (element as Any)['~trace'].traced;

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
 * // trace-006: Tracer event subscription.
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
 * @example
 * ```ts
 * // trace-007: Custom trace event emission.
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
 * @example
 * ```ts
 * // trace-008: Subscribe to trace events once.
 * tracer.once('perf', (data) => {
 *   console.log(`First function took ${data.durationMs}ms`);
 * });
 *
 * const fn = traceable('test', (x: number) => x * 2).trace();
 * fn(5); // This will trigger the once listener.
 * fn(10); // This will NOT trigger the once listener.
 * ```
 *
 * @public
 */
const tracer = (() => {
  type TracerEvents = 'start' | 'end' | 'error' | 'perf';

  const tracer = new EventEmitter();
  tracer.setMaxListeners(MAX_LISTENERS);

  return {
    /**
     * Emit a trace event with data.
     *
     * @param event - The event type to emit.
     * @param data - The data to include with the event.
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
     * @public
     */
    once: (event: TracerEvents, listener: (...args: Any[]) => void) => {
      tracer.once(event, listener);
    },
  };
})();

/**
 * Get the trace information for a traceable element.
 *
 * This function provides safe access to the internal trace data of a traceable element.
 * It returns detailed information about the element's tracing configuration including
 * metadata, performance data, and hierarchical relationships.
 *
 * @param element - The traceable element to get information for.
 * @returns The trace information.
 * @throws A {@link TraceableError} when the element is not traceable.
 *
 * @example
 * ```ts
 * // trace-009: Get trace information for an element.
 * const fn = () => 'test';
 * const traceableFn = traceable('test', fn)
 *   .meta({
 *     name: 'TestFunction',
 *     description: 'A simple test function',
 *     scope: 'testing'
 *   });
 *
 * const info = traceInfo(traceableFn);
 * // info: {
 * //   id: 'uuid',
 * //   tag: 'test',
 * //   name: 'TestFunction',
 * //   traced: false,
 * //   meta: { name: 'TestFunction', description: '...', scope: 'testing' }
 * // }
 * ```
 *
 * @public
 */
const traceInfo = <T extends { '~trace': Traceable<Any, Any, Any>['~trace'] }>(
  element: T,
): T['~trace'] => {
  if (!isTraceable(element)) {
    throw new TraceableError('NOT_TRACEABLE', 'Element is not traceable');
  }

  return element['~trace'];
};

export type { Traceable, TraceableMeta };
export { traceable, tracer, isTraceable, isTraced, traceInfo, TraceableError };
