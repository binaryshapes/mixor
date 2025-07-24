/*
 * This file is part of the Mixor project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { element } from './element';
import type { EventStore } from './event';
import type { Any, Prettify } from './generics';
import { hash } from './hash';
import { Panic } from './panic';
import type { Result } from './result';
import { isErr, ok } from './result';
import type { InferSchema, Schema, SchemaErrors, SchemaValues } from './schema';
import { type Specification, isSpec } from './specification';

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
  E extends EventStore<Any>,
  S extends Record<string, Specification<SchemaValues<T>>>,
  M,
> = {
  /** Schema for validating the aggregate's data structure. */
  schema: Schema<T>;
  /** Event store for handling domain events. */
  events: E;
  /** Business rule specifications for validation. */
  specs: S;
  /** Custom methods that define aggregate behavior. */
  methods: M;
};

/**
 * The resulting aggregate instance that combines the validated data structure,
 * custom methods, and event handling capabilities.
 *
 * @typeParam C - The aggregate configuration type.
 *
 * @internal
 */
type AggregateInstance<C extends AggregateConfig<Any, Any, Any, Any>> = Prettify<
  Readonly<InferSchema<C['schema']>> &
    ReturnType<C['methods']> & {
      /** Retrieves all events from the event store without removing them. */
      getEvents: AggregateState<C>['getEvents'];
      /** Retrieves and removes all events from the event store. */
      pullEvents: AggregateState<C>['pullEvents'];
      /** Gets the current state as a readonly object. */
      getState: AggregateState<C>['getState'];
    }
>;

/**
 * Internal state manager that provides access to schema validation, event handling,
 * and business rule validation capabilities.
 *
 * @typeParam C - The aggregate configuration type.
 * @typeParam T - The inferred schema fields type.
 * @typeParam E - The inferred event store type.
 * @typeParam SE - The inferred specification error type.
 *
 * @internal
 */
type AggregateState<
  C extends AggregateConfig<Any, Any, Any, Any>,
  T = C['schema'] extends Schema<infer F> ? F : never,
  E extends EventStore<Any> = C['events'],
  SE = C['specs'] extends Record<string, Specification<Any>> ? SpecError<C['specs']> : never,
> = {
  /** Emits an event to the event store. */
  emit: E extends EventStore<Any> ? E['add'] : never;
  /** Retrieves and removes all events from the event store. */
  pullEvents: E extends EventStore<Any> ? E['pull'] : never;
  /** Retrieves all events from the event store without removing them. */
  getEvents: E extends EventStore<Any> ? E['list'] : never;

  /** Sets a field value with schema validation. */
  set<K extends keyof SchemaValues<T> & keyof SchemaErrors<T>>(
    key: K,
    value: SchemaValues<T>[K],
  ): Result<SchemaValues<T>, SchemaErrors<T>[K]>;
  /** Gets a readonly current state of the aggregate. */
  getState(): Readonly<SchemaValues<T>>;

  /** Validates the current state against all business rule specifications. */
  validateSpecs(): Result<SchemaValues<T>, SE>;
};

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
    doc: string,
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
    doc: string,
    fn: (...args: T) => Result<R, E>,
    specs?: {
      before?: BeforeSpec;
      after?: AfterSpec;
    },
  ): (...args: T) => Result<R, E | SpecError<BeforeSpec> | SpecError<AfterSpec>>;
}

const createAggregateState = <C extends AggregateConfig<Any, Any, Any, Any>>(
  config: C,
  initialState: InferSchema<C['schema']>,
): AggregateState<C> => {
  const { schema, events, specs } = config;
  // Use direct reference instead of copying.
  let state = { ...(initialState as Any) };

  // Always we need to provide access to the aggregate value state.
  const valueStateManager = {
    get: <K extends keyof typeof state>(key: K): (typeof state)[K] => state[key],
    set: <K extends keyof typeof state>(key: K, value: (typeof state)[K]) => {
      const fieldSchema = schema[key];
      if (fieldSchema && typeof fieldSchema === 'function') {
        const validationResult = fieldSchema(value);
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

  // If specs are provided, we can use them to validate the state.
  const specManager = specs
    ? {
        validateSpecs() {
          for (const spec of specs) {
            const res = spec.satisfy(state);
            if (isErr(res)) return res;
          }
          return ok(state);
        },
      }
    : {};

  return {
    ...valueStateManager,
    ...eventManager,
    ...specManager,
  } as unknown as AggregateState<C>;
};

const createAggregateMethodLogic = <C extends AggregateConfig<Any, Any, Any, Any>>(
  stateManager: AggregateState<C>,
  specs?: C['specs'],
) => {
  // If no specs are provided, we can create a simple method logic.
  if (!specs) {
    return <T extends unknown[] = [], R = Any, E = Any>(
      doc: string,
      fn: (...args: T) => Result<R, E>,
    ): ((...args: T) => Result<R, E>) => {
      const aggregateMethod = (...args: T) => fn(...args);
      return element(aggregateMethod, {
        tag: 'Method',
        hash: hash(doc, fn),
        doc,
      });
    };
  }

  // If specs are provided, we can create a method logic with specs.
  return <
    T extends unknown[] = [],
    R = Any,
    E = Any,
    BeforeSpec = undefined,
    AfterSpec = undefined,
  >(
    doc: string,
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

    return element(aggregateMethod, {
      tag: 'Method',
      hash: hash(doc, fn, specs),
      doc,
    });
  };
};

/**
 * Interface for the aggregate constructor function with overloads.
 * Supports both documented and non-documented aggregate creation.
 *
 * @internal
 */
interface AggregateConstructor {
  /**
   * Creates an aggregate without documentation.
   *
   * @typeParam T - The schema type.
   * @typeParam E - The event type.
   * @typeParam S - The specifications type.
   * @typeParam M - The methods type.
   * @param config - The aggregate configuration.
   * @returns A function that creates aggregate instances.
   */
  <
    T,
    E extends EventStore<Any>,
    S extends Record<string, Specification<SchemaValues<T>>>,
    M extends (options: {
      self: AggregateState<AggregateConfig<T, E, S, M>>;
      fn: AggregateMethod;
      specs: S;
    }) => Record<string, (...args: Any[]) => Any>,
  >(
    config: AggregateConfig<T, E, S, M>,
  ): (
    input: InferSchema<Schema<T>>,
    options?: { checkSpecs?: boolean },
  ) => Result<AggregateInstance<AggregateConfig<T, E, S, M>>, SchemaErrors<T> | SpecError<S>>;

  /**
   * Creates an aggregate with documentation.
   *
   * @typeParam T - The schema type.
   * @typeParam E - The event type.
   * @typeParam S - The specifications type.
   * @typeParam M - The methods type.
   * @param doc - The documentation string for the aggregate.
   * @param config - The aggregate configuration.
   * @returns A function that creates aggregate instances.
   */
  <
    T,
    E extends EventStore<Any>,
    S extends Record<string, Specification<SchemaValues<T>>>,
    M extends (options: {
      self: AggregateState<AggregateConfig<T, E, S, M>>;
      fn: AggregateMethod;
      specs: S;
    }) => Record<string, (...args: Any[]) => Any>,
  >(
    doc: string,
    config: AggregateConfig<T, E, S, M>,
  ): (
    input: InferSchema<Schema<T>>,
    options?: { checkSpecs?: boolean },
  ) => Result<AggregateInstance<AggregateConfig<T, E, S, M>>, SchemaErrors<T> | SpecError<S>>;
}

/**
 * Panic error for the aggregate module.
 *
 * @public
 */
const AggregateError = Panic<
  'AGGREGATE',
  // Raised when the aggregate configuration is invalid.
  'INVALID_CONFIGURATION'
>('AGGREGATE');

const aggregate: AggregateConstructor = <
  T,
  E extends EventStore<Any>,
  S extends Record<string, Specification<SchemaValues<T>>>,
  M extends (options: {
    self: AggregateState<AggregateConfig<T, E, S, M>>;
    fn: AggregateMethod;
    specs: S;
  }) => Record<string, (...args: Any[]) => Any>,
>(
  docOrConfig: string | AggregateConfig<T, E, S, M>,
  configParam?: AggregateConfig<T, E, S, M>,
) => {
  // Determine if first parameter is documentation or config.
  const isDocumented = typeof docOrConfig === 'string';
  const doc = isDocumented ? docOrConfig : undefined;
  const actualConfig =
    isDocumented && configParam ? configParam : (docOrConfig as AggregateConfig<T, E, S, M>);

  // If the configuration is invalid, throw an error.
  if (!actualConfig) {
    throw new AggregateError('INVALID_CONFIGURATION', 'Invalid aggregate configuration.');
  }

  return (
    input: InferSchema<typeof actualConfig.schema>,
    options?: { checkSpecs?: boolean },
  ): Result<AggregateInstance<AggregateConfig<T, E, S, M>>, SchemaErrors<T> | SpecError<S>> => {
    // If the input is not valid, return the error.
    const validationResult = actualConfig.schema(input as Any);
    if (isErr(validationResult)) {
      return validationResult as Any;
    }

    // Create the state manager with the validated state.
    const state = createAggregateState<typeof actualConfig>(
      actualConfig,
      validationResult.value as Any,
    );

    // If checkSpecs is enabled and specifications exist, validate all specs.
    if (options?.checkSpecs && actualConfig.specs) {
      const specValidationResult = state.validateSpecs();
      if (specValidationResult && isErr(specValidationResult)) {
        return specValidationResult;
      }
    }

    // If methods are provided, we can create the aggregate methods.
    const methods = actualConfig.methods
      ? actualConfig.methods({
          self: state,
          fn: createAggregateMethodLogic(state, actualConfig.specs),
          specs: actualConfig.specs,
        })
      : {};

    // Create instance with methods.
    const instance = actualConfig.events
      ? {
          ...methods,
          getEvents: state.getEvents,
          pullEvents: state.pullEvents,
          getState: state.getState,
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

    return ok(
      element(instance, {
        tag: 'Aggregate',
        hash: hash(
          actualConfig.schema,
          actualConfig.events,
          actualConfig.specs,
          actualConfig.methods,
        ),
        doc,
      }),
    ) as Any;
  };
};

export { aggregate, AggregateError };
