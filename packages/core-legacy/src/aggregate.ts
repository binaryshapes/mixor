/*
 * This file is part of the Mixor project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { ErrorMode } from './_err';
import type { EventStore } from './event';
import type { Any, Prettify } from './generics';
import { panic } from './panic';
import { type Result, isErr, ok } from './result';
import type { Schema, SchemaErrors, SchemaValues } from './schema';
import { type Specification, isSpec } from './specification';
import type { Value } from './value';

/**
 * Configuration for creating an aggregate with schema validation, event handling,
 * business rule specifications, and custom methods.
 *
 * @typeParam T - The schema type that defines the aggregate's data structure.
 * @typeParam E - The event type that defines the events this aggregate can emit.
 * @typeParam S - The specifications type that defines business rules for validation.
 * @typeParam M - The methods type that defines custom behavior for the aggregate.
 *
 * @internal
 */
type AggregateConfig<
  T,
  E extends EventStore<Any> | undefined,
  S extends Record<string, Specification<SchemaValues<T>>> | undefined,
  M,
> = {
  /** Schema for validating the aggregate's data structure. */
  schema: Schema<T>;
  /** Event store for handling domain events. */
  events?: E;
  /** Business rule specifications for validation. */
  specs?: S;
  /** Custom methods that define aggregate behavior. */
  methods: M;
};

/**
 * Conditional type that provides event methods only when events are defined.
 *
 * @typeParam E - The event store type.
 *
 * @internal
 */
type EventMethods<E> =
  E extends EventStore<Any>
    ? {
        /** Emits an event to the event store. */
        emit: E['add'];
        /** Retrieves and removes all events from the event store. */
        pullEvents: E['pull'];
        /** Retrieves all events from the event store without removing them. */
        getEvents: E['list'];
      }
    : never;

/**
 * Maps aggregate methods considering the validation mode to ensure correct error types.
 * Uses the centralized error mode concept from {@link ErrorMode}.
 *
 * @typeParam M - The methods type.
 * @typeParam Mode - The validation mode.
 *
 * @internal
 */
type AggregateMethods<M, Mode extends ErrorMode> =
  M extends Record<string, (...args: Any[]) => Result<Any, Any>>
    ? {
        [K in keyof M]: M[K] extends (...args: infer Args) => Result<infer Success, infer RR>
          ? (...args: Args) => Result<
              Success,
              // Hack to remove array of errors in strict mode.
              Mode extends 'strict' ? Exclude<RR, Array<Any>> : Extract<RR, Array<Any>>
            >
          : M[K];
      }
    : M;

/**
 * The resulting aggregate instance that combines the validated data structure,
 * custom methods, and event handling capabilities.
 * Uses the centralized error mode concept from {@link ErrorMode}.
 *
 * @typeParam C - The aggregate configuration type.
 * @typeParam Mode - The validation mode.
 *
 * @internal
 */
type AggregateInstance<
  C extends AggregateConfig<Any, Any, Any, Any>,
  Mode extends ErrorMode,
> = Prettify<
  Readonly<C['schema']['Type']> &
    // This overrides the methods to ensure the correct error type is returned.
    AggregateMethods<ReturnType<C['methods']>, Mode> &
    EventMethods<C['events']> & {
      /** Gets the current state as a readonly object. */
      getState: AggregateState<C, Mode>['getState'];
    }
>;

/**
 * Helper type to extract the error type for a specific field based on the mode.
 *
 * @typeParam T - The schema fields type.
 * @typeParam K - The specific field key.
 * @typeParam Mode - The validation mode ('strict' | 'all').
 *
 * @internal
 */
type SchemaFieldError<T, K extends keyof T, Mode> =
  T[K] extends Value<Any, infer E> ? (Mode extends 'all' ? E[] : E) : never;

/**
 * Internal state manager that provides access to schema validation, event handling,
 * and business rule validation capabilities.
 * Uses the centralized error mode concept from {@link ErrorMode}.
 *
 * @typeParam C - The aggregate configuration type.
 * @typeParam Mode - The validation mode.
 * @typeParam T - The inferred schema fields type.
 * @typeParam E - The inferred event store type.
 * @typeParam S - The inferred specifications type.
 *
 * @internal
 */
type AggregateState<
  C extends AggregateConfig<Any, Any, Any, Any>,
  Mode extends ErrorMode,
  T = C['schema'] extends Schema<infer F> ? F : never,
  E extends EventStore<Any> | undefined = C['events'],
> = {
  /** Sets a field value with schema validation. */
  set<K extends keyof T & keyof SchemaValues<T> & keyof SchemaErrors<T, Mode>>(
    key: K,
    value: SchemaValues<T>[K],
  ): Result<SchemaValues<T>, SchemaFieldError<T, K, Mode>>;
  /** Gets a readonly current state of the aggregate. */
  getState(): Readonly<SchemaValues<T>>;
} & EventMethods<E>;

/**
 * Extracts the error type from a specification by inferring the error type
 * from the satisfy method's return type.
 *
 * @typeParam T - The specification type to extract the error from.
 *
 * @internal
 */
type SpecError<T> = T extends { satisfy: (entity: Any) => Result<Any, infer E> } ? E : never;

/**
 * Function interface for creating aggregate methods with optional business rule validation.
 * Supports both simple methods without validation and methods with before/after specifications.
 *
 * @internal
 */
interface AggregateMethod {
  /**
   * Creates a method without business rule validation.
   *
   * @typeParam T - The method arguments type.
   * @typeParam R - The method return type.
   * @typeParam E - The method error type.
   */
  <T extends unknown[] = [], R = Any, E = Any>(
    fn: (...args: T) => Result<R, E>,
  ): (...args: T) => Result<R, E>;

  /**
   * Creates a method with optional business rule validation using specifications.
   *
   * @typeParam T - The method arguments type.
   * @typeParam R - The method return type.
   * @typeParam E - The method error type.
   * @typeParam BeforeSpec - The specification to validate before method execution.
   * @typeParam AfterSpec - The specification to validate after method execution.
   */
  <T extends unknown[] = [], R = Any, E = Any, BeforeSpec = undefined, AfterSpec = undefined>(
    fn: (...args: T) => Result<R, E>,
    specs?: {
      before?: BeforeSpec;
      after?: AfterSpec;
    },
  ): (...args: T) => Result<R, E | SpecError<BeforeSpec> | SpecError<AfterSpec>>;
}

const createAggregateState = <
  C extends AggregateConfig<Any, Any, Any, Any>,
  Mode extends ErrorMode,
>(
  config: C,
  initialState: C['schema']['Type'],
  mode: Mode,
): AggregateState<C, Mode> => {
  const { schema, events } = config;
  // Use direct reference instead of copying.
  let state = { ...(initialState as Any) };

  // Always we need to provide access to the aggregate value state.
  const valueStateManager = {
    get: <K extends keyof typeof state>(key: K): (typeof state)[K] => state[key],
    set: <K extends keyof typeof state>(key: K, value: (typeof state)[K]) => {
      const fieldSchema = schema[key];
      if (fieldSchema && typeof fieldSchema === 'function') {
        const validationResult = fieldSchema(value, mode);
        if (isErr(validationResult)) {
          return validationResult;
        }
      }
      // Update the internal state directly.
      state = { ...state, [key]: value };

      // Return state reference instead of copying.
      return ok(state);
    },
    getState: () => Object.freeze({ ...state }),
  };

  // If event store is provided, we can use it to get, emit, pull and get events.
  const eventManager = events
    ? {
        emit: events.add,
        pullEvents: events.pull,
        getEvents: events.list,
      }
    : {};

  return {
    ...valueStateManager,
    ...eventManager,
  } as unknown as AggregateState<C, Mode>;
};

/**
 * Creates the logic for an aggregate method.
 * Which basically is a wrapper around the method to apply the specifications (if provided).
 *
 * @typeParam C - The aggregate configuration type.
 * @typeParam Mode - The validation mode ('strict' | 'all').
 * @param stateManager - The state manager.
 * @param specs - The specifications.
 * @returns The aggregate method logic.
 *
 * @internal
 */
const createAggregateMethodLogic = <
  C extends AggregateConfig<Any, Any, Any, Any>,
  Mode extends ErrorMode,
>(
  stateManager: AggregateState<C, Mode>,
  specs?: C['specs'],
) => {
  // If no specs are provided, we can create a simple method logic.
  if (!specs) {
    return <T extends unknown[] = [], R = Any, E = Any>(
        fn: (...args: T) => Result<R, E>,
      ): ((...args: T) => Result<R, E>) =>
      (...args: T) =>
        fn(...args);
  }

  // If specs are provided, we can create a method logic with specs.
  return <
    T extends unknown[] = [],
    R = Any,
    E = Any,
    BeforeSpec = undefined,
    AfterSpec = undefined,
  >(
    fn: (...args: T) => Result<R, E>,
    specs?: { before?: BeforeSpec; after?: AfterSpec },
  ) => {
    const aggregateMethod = (...args: T) => {
      if (specs?.before && isSpec(specs.before) && stateManager) {
        const currentState = stateManager.getState();
        const beforeResult = specs.before.satisfy(currentState);
        if (isErr(beforeResult)) return beforeResult;
      }

      const fnResult = fn(...args);
      if (isErr(fnResult)) return fnResult;

      if (specs?.after && isSpec(specs.after) && stateManager) {
        const currentState = stateManager.getState();
        const afterResult = specs.after.satisfy(currentState);
        if (isErr(afterResult)) return afterResult;
      }

      return fnResult;
    };

    return aggregateMethod;
  };
};

/**
 * Panic error for the aggregate module. Used when aggregate operations fail
 * due to invalid configuration or unexpected errors.
 *
 * @public
 */
const AggregateError = panic<
  'Aggregate',
  // Raised when the aggregate configuration is invalid.
  'InvalidConfiguration'
>('Aggregate');

/**
 * Creates an aggregate with schema validation, event handling, business rule specifications,
 * and custom methods. Aggregates are domain objects that encapsulate business logic and
 * maintain consistency through validation rules.
 *
 * @param config - Aggregate configuration with schema, events, specifications, and methods.
 * @returns A function that creates aggregate instances with validation and event handling.
 *
 * @public
 */
const aggregate = <
  T,
  M extends (options: {
    self: AggregateState<AggregateConfig<T, E, S, M>, 'strict' | 'all'>;
    fn: AggregateMethod;
    specs: S;
  }) => Record<string, (...args: Any[]) => Any>,
  EE = undefined,
  S extends Record<string, Specification<SchemaValues<T>>> | undefined = never,
  E extends EventStore<Any> | undefined = EventStore<EE>,
>(
  config: AggregateConfig<T, E, S, M>,
) => {
  // If the configuration is invalid, throw an error.
  if (!config) {
    throw new AggregateError('InvalidConfiguration', 'Invalid aggregate configuration.');
  }

  return <Mode extends ErrorMode>(
    input: (typeof config.schema)['Type'],
    mode?: Mode,
  ): Result<
    AggregateInstance<AggregateConfig<T, E, S, M>, Mode>,
    SchemaErrors<T, Mode> | SpecError<S>
  > => {
    // If the input is not valid, return the error.
    const validationResult = config.schema(input as Any, mode as Any);
    if (isErr(validationResult)) {
      return validationResult as Any;
    }

    // Create the state manager with the validated state.
    const state = createAggregateState<typeof config, Mode>(
      config,
      validationResult.value as Any,
      mode ?? ('all' as Any),
    );

    // If methods are provided, we can create the aggregate methods.
    const methods = config.methods
      ? config.methods({
          self: state as Any,
          fn: createAggregateMethodLogic<typeof config, Mode>(state, config.specs),
          specs: config.specs as S,
        })
      : {};

    // Create instance with methods.
    const instance = config.events
      ? {
          ...methods,
          getEvents: state.getEvents,
          pullEvents: state.pullEvents,
          getState: state.getState,
          emit: state.emit,
        }
      : {
          ...methods,
          getState: state.getState,
        };

    // Add dynamic getters for state properties.
    Object.keys(state.getState()).forEach((key) => {
      Object.defineProperty(instance, key, {
        get() {
          return state.getState()[key as keyof ReturnType<typeof state.getState>];
        },
        enumerable: true,
        configurable: true,
      });
    });

    return ok(instance) as Any;
  };
};

export { aggregate, AggregateError };
