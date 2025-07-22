/*
 * This file is part of the Mixor project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { element } from './element';
import type { Event, EventStore } from './event';
import type { Any, Prettify } from './generics';
import { hash } from './hash';
import type { Result } from './result';
import { isErr, ok } from './result';
import type { InferSchema, Schema, SchemaErrors, SchemaValues } from './schema';
import { type Specification, isSpec } from './specification';

type AggregateConfig<
  T,
  E extends Event<string, Any>,
  S extends Record<string, Specification<SchemaValues<T>>>,
  M,
> = {
  schema: Schema<T>;
  events: EventStore<E>;
  specs: S;
  methods: M;
};

type AggregateInstance<C extends AggregateConfig<Any, Any, Any, Any>> = Prettify<
  Readonly<InferSchema<C['schema']>> &
    ReturnType<C['methods']> & {
      getEvents: AggregateState<C>['getEvents'];
      pullEvents: AggregateState<C>['pullEvents'];
    }
>;

type AggregateState<
  C extends AggregateConfig<Any, Any, Any, Any>,
  T = C['schema'] extends Schema<infer F> ? F : never,
  E extends EventStore<Any> = C['events'],
  SE = C['specs'] extends Record<string, Specification<Any>> ? SpecError<C['specs']> : never,
> = {
  // Event store methods.
  emit: E extends EventStore<Any> ? E['add'] : never;
  pullEvents: E extends EventStore<Any> ? E['pull'] : never;
  getEvents: E extends EventStore<Any> ? E['list'] : never;

  // Schema methods.
  set<K extends keyof SchemaValues<T> & keyof SchemaErrors<T>>(
    key: K,
    value: SchemaValues<T>[K],
  ): Result<SchemaValues<T>, SchemaErrors<T>[K]>;
  getState(): Readonly<SchemaValues<T>>;

  // Specs methods.
  validateSpecs(): Result<SchemaValues<T>, SE>;
};

type SpecError<T> = T extends { satisfy: (entity: Any) => Result<Any, infer E> } ? E : never;

interface AggregateMethodLogic {
  // Definition of the method logic without specs.
  <T extends unknown[] = [], R = Any, E = Any>(
    doc: string,
    fn: (...args: T) => Result<R, E>,
  ): (...args: T) => Result<R, E>;

  // Definition of the method logic with specs.
  <T extends unknown[] = [], R = Any, E = Any, BeforeSpec = undefined, AfterSpec = undefined>(
    doc: string,
    fn: (...args: T) => Result<R, E>,
    specs?: {
      before?: BeforeSpec;
      after?: AfterSpec;
    },
  ): (...args: T) => Result<R, E | SpecError<BeforeSpec> | SpecError<AfterSpec>>;
}

type AggregateManagerConfig<C extends AggregateConfig<Any, Any, Any, Any>> = C & {
  initialState: InferSchema<C['schema']>;
};

const createAggregateState = <C extends AggregateConfig<Any, Any, Any, Any>>(
  config: AggregateManagerConfig<C>,
): AggregateState<C> => {
  const { schema, events, specs, initialState } = config;
  const state = { ...(initialState as object) };

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
      // Update the internal state.
      state[key] = value;
      return ok({ ...state });
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
      const methodFn = (...args: T) => fn(...args);
      return element(methodFn, {
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
    const methodFn = (...args: T) => {
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

    return element(methodFn, {
      tag: 'Method',
      hash: hash(doc, fn, specs),
      doc,
    });
  };
};

const aggregate = <
  T,
  E extends Event<string, Any>,
  S extends Record<string, Specification<SchemaValues<T>>>,
  M extends (options: {
    self: AggregateState<AggregateConfig<T, E, S, M>>;
    fn: AggregateMethodLogic;
    specs: S;
  }) => Record<string, (...args: Any[]) => Any>,
>(
  config: AggregateConfig<T, E, S, M>,
) => {
  const aggregate = (
    input: InferSchema<typeof config.schema>,
    options?: { checkSpecs?: boolean },
  ): Result<AggregateInstance<AggregateConfig<T, E, S, M>>, SchemaErrors<T> | SpecError<S>> => {
    // If the input is not valid, return the error.
    const validationResult = config.schema(input as Any);
    if (isErr(validationResult)) {
      return validationResult as Any;
    }

    // Create the state manager with the validated state.
    const state = createAggregateState<typeof config>({
      ...config,
      initialState: validationResult.value as InferSchema<typeof config.schema>,
    });

    // If checkSpecs is enabled and specifications exist, validate all specs.
    if (options?.checkSpecs && config.specs) {
      const specValidationResult = state.validateSpecs();
      if (specValidationResult && isErr(specValidationResult)) {
        return specValidationResult;
      }
    }

    // If methods are provided, we can create the aggregate methods.
    const methods = config.methods
      ? config.methods({
          self: state,
          fn: createAggregateMethodLogic(state, config.specs),
          specs: config.specs,
        })
      : {};

    return ok(
      element(
        {
          ...state.getState(),
          ...methods,
          getEvents: config.events ? state.getEvents : undefined,
          pullEvents: config.events ? state.pullEvents : undefined,
        },
        {
          tag: 'Aggregate',
          hash: hash(config.schema, config.events, config.specs, config.methods),
          doc: 'Aggregate',
        },
      ),
    ) as Any;
  };

  return aggregate;
};

export { aggregate };
