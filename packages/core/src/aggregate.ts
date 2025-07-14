/*
 * This file is part of the Mixor project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { type Event, type EventStore } from './event';
import type { Any, Prettify } from './generics';
import { hash } from './hash';
import { type Result, isErr, ok } from './result';
import {
  type Schema,
  type SchemaErrors,
  type SchemaFields,
  type SchemaValues,
  isSchema,
  schema as makeSchema,
} from './schema';
import { type Specification, isSpec } from './specification';

// TODO: The aggregate object must expose all schema fields constructors as methods.

/**
 * Type for the fn function that creates methods with specification validation.
 *
 * @typeParam T - The arguments type for the method (as tuple).
 * @typeParam R - The return type for the method.
 * @typeParam E - The error type for the method.
 * @typeParam BeforeSpec - The specification type to validate before execution.
 * @typeParam AfterSpec - The specification type to validate after execution.
 *
 * @internal
 */
type FnFunction = <
  T extends unknown[] = [],
  R = Any,
  E = Any,
  BeforeSpec = undefined,
  AfterSpec = undefined,
>(
  doc: string,
  fn: (...args: T) => Result<R, E>,
  specs?: {
    before?: BeforeSpec;
    after?: AfterSpec;
  },
) => (...args: T) => Result<R, E | SpecError<BeforeSpec> | SpecError<AfterSpec>>;

/**
 * Utility to extract the error type from a specification.
 *
 * @typeParam T - The specification type.
 *
 * @internal
 */
type SpecError<T> = T extends { satisfy: (entity: Any) => Result<Any, infer E> } ? E : never;

/**
 * Type for methods builder function that receives the aggregate state manager and returns methods.
 *
 * @typeParam F - The schema fields type.
 * @typeParam E - The event type.
 * @typeParam S - The specification error type.
 * @typeParam Specs - The specifications object type.
 *
 * @internal
 */
type MethodsBuilder<
  F extends SchemaFields = SchemaFields,
  E extends Event<string, Any> = Event<string, Any>,
  S = Any,
  Specs = Record<string, Specification<SchemaValues<F>, S>> | undefined,
> = (
  self: AggregateStateManager<F, E, S>,
  fn: FnFunction,
  specs: Specs,
) => Record<string, (...args: Any[]) => Any>;

/**
 * Type-safe state manager for aggregates that encapsulates state and provides validation.
 *
 * @typeParam F - The schema fields type.
 * @typeParam E - The event type.
 * @typeParam S - The specification error type.
 *
 * @internal
 */
interface AggregateStateManager<
  F extends SchemaFields = SchemaFields,
  E extends Event<string, Any> = Event<string, Any>,
  S = never,
> {
  /**
   * Gets a field value from the aggregate state.
   *
   * @param key - The field key to retrieve.
   * @returns The field value.
   */
  get<K extends keyof SchemaValues<F>>(key: K): SchemaValues<F>[K];

  /**
   * Sets a field value in the aggregate state with validation.
   *
   * @param key - The field key to set.
   * @param value - The value to set.
   * @returns A result indicating success or validation error.
   */
  set<K extends keyof SchemaValues<F> & keyof F>(
    key: K,
    value: SchemaValues<F>[K],
  ): Result<SchemaValues<F>, SchemaErrors<F>[K]>;

  /**
   * Gets the current state as a readonly object.
   *
   * @returns A readonly copy of the current state.
   */
  getState(): Readonly<SchemaValues<F>>;

  /**
   * Emits an event with the given key and value.
   *
   * @param key - The event key.
   * @param value - The event value.
   * @returns The emitted event.
   */
  emit<K extends E['key']>(key: K, value: Extract<E, { key: K }>['value']): Extract<E, { key: K }>;

  /**
   * Gets all events that have been emitted.
   *
   * @returns Array of all events.
   */
  getEvents(): E[];

  /**
   * Pulls all events and clears the event store.
   *
   * @returns Array of all events (clears the store).
   */
  pullEvents(): E[];

  /**
   * Validates the current state against all specifications.
   *
   * @returns A result indicating if all specifications are satisfied.
   */
  validateSpecs?(): Result<SchemaValues<F>, S>;
}

/**
 * Type-safe aggregate instance that exposes only the public interface.
 *
 * @typeParam F - The schema fields type.
 * @typeParam M - The methods type.
 * @typeParam E - The event type.
 *
 * @internal
 */
type AggregateInstance<
  F extends SchemaFields,
  M,
  E extends Event<string, Any> = Event<string, Any>,
> = Prettify<
  Readonly<SchemaValues<F>> &
    M & {
      getEvents(): E[];
      pullEvents(): E[];
    }
>;

/**
 * Type for aggregate specifications.
 *
 * @typeParam F - The schema fields type.
 * @typeParam S - The specification error type.
 *
 * @internal
 */
type AggregateSpecs<F extends SchemaFields, S> = Record<string, Specification<SchemaValues<F>, S>>;

/**
 * Configuration for state manager features.
 *
 * @typeParam F - The schema fields type.
 * @typeParam E - The event type.
 * @typeParam S - The specification error type.
 *
 * @internal
 */
interface StateManagerConfig<F extends SchemaFields, E extends Event<string, Any>, S> {
  /** The schema for validating state changes. */
  schema: Schema<F>;
  /** The initial state for the aggregate. */
  initialState: SchemaValues<F>;
  /** Optional event store for handling events. */
  eventStore?: EventStore<E>;
  /** Optional specifications for business rule validation. */
  specifications?: Specification<SchemaValues<F>, S>[];
}

/**
 * Creates a state manager with the given configuration.
 *
 * @typeParam F - The schema fields type.
 * @typeParam E - The event type.
 * @typeParam S - The specification error type.
 * @param config - The configuration for the state manager.
 * @returns A configured state manager.
 *
 * @internal
 */
function createStateManager<
  F extends SchemaFields,
  E extends Event<string, Any> = Event<string, Any>,
  S = never,
>(config: StateManagerConfig<F, E, S>): AggregateStateManager<F, E, S> {
  let state = { ...config.initialState };

  const baseManager = {
    get: <K extends keyof SchemaValues<F>>(key: K): SchemaValues<F>[K] => state[key],
    set<K extends keyof SchemaValues<F> & keyof F>(
      key: K,
      value: SchemaValues<F>[K],
    ): Result<SchemaValues<F>, SchemaErrors<F>[K]> {
      const fieldSchema = (config.schema as Record<string, unknown>)[key as string];
      if (fieldSchema && typeof fieldSchema === 'function') {
        const validationResult = fieldSchema(value) as Result<void, SchemaErrors<F>[K]>;
        if (isErr(validationResult)) {
          return validationResult;
        }
      }
      state = { ...state, [key]: value };
      return ok(state as SchemaValues<F>);
    },
    getState: (): Readonly<SchemaValues<F>> => Object.freeze({ ...state }),
  };

  const eventManager = config.eventStore
    ? (() => {
        const eventStore = config.eventStore;
        return {
          emit: <K extends E['key']>(
            key: K,
            value: Extract<E, { key: K }>['value'],
          ): Extract<E, { key: K }> => eventStore.add(key, value) as Extract<E, { key: K }>,
          getEvents: (): E[] => eventStore.list(),
          pullEvents: (): E[] => eventStore.pull(),
        };
      })()
    : {};

  const specManager = config.specifications
    ? (() => {
        const specifications = config.specifications;
        return {
          validateSpecs(): Result<SchemaValues<F>, S> {
            for (const spec of specifications) {
              const res = spec.satisfy(state);
              if (isErr(res)) return res;
            }
            return ok(state);
          },
        };
      })()
    : {};

  return {
    ...baseManager,
    ...eventManager,
    ...specManager,
  } as AggregateStateManager<F, E, S>;
}

/**
 * Creates a function for method creation with optional specification validation.
 *
 * @typeParam S - The specification error type.
 * @param specifications - Optional specifications for validation.
 * @param stateManager - Optional state manager for validation context.
 * @returns A function factory for creating methods.
 *
 * @internal
 */
function createFnFunction<S = never>(
  specifications?: Record<string, Specification<Any, S>>,
  stateManager?: AggregateStateManager<Any, Any, S>,
): FnFunction {
  if (!specifications) {
    return <T extends unknown[] = [], R = Any, E = Any>(
      doc: string,
      fn: (...args: T) => Result<R, E>,
    ) => {
      const methodFn = (...args: T) => fn(...args);
      return Object.assign(methodFn, {
        _tag: 'Method' as const,
        _doc: doc,
        _hash: hash(doc, fn),
      });
    };
  }

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

      const flowFunction = fn(...args);
      if (isErr(flowFunction)) return flowFunction;

      if (specs?.after && isSpec(specs.after) && stateManager) {
        const currentState = stateManager.getState();
        const afterResult = specs.after.satisfy(currentState);
        if (isErr(afterResult)) return afterResult;
      }

      return flowFunction;
    };

    return Object.assign(methodFn, {
      _tag: 'Method' as const,
      _doc: doc,
      _hash: hash(doc, fn, specs),
    });
  };
}

/**
 * Configuration options for aggregate instance creation.
 *
 * @internal
 */
interface AggregateInstanceOptions {
  /**
   * Whether to validate all specifications during instance creation.
   * If true, the aggregate will validate all specifications against the initial state.
   * If validation fails, the aggregate creation will return an error instead of the instance.
   */
  checkSpecs?: boolean;
}

/**
 * Creates an aggregate instance with the given configuration.
 *
 * @typeParam F - The schema fields type.
 * @typeParam M - The methods type.
 * @typeParam E - The event type.
 * @typeParam S - The specification error type.
 * @param config - The configuration for the aggregate.
 * @param methods - The methods object for the aggregate.
 * @returns A frozen aggregate instance.
 *
 * @internal
 */
function createAggregateInstance<
  F extends SchemaFields,
  M,
  E extends Event<string, Any> = Event<string, Any>,
  S = never,
>(config: StateManagerConfig<F, E, S>, methods: M): AggregateInstance<F, M, E> {
  const stateManager = createStateManager(config);

  const instance = {
    ...stateManager.getState(),
    ...methods,
  };

  if (config.eventStore) {
    Object.assign(instance, {
      getEvents: () => stateManager.getEvents(),
      pullEvents: () => stateManager.pullEvents(),
    });
  }

  return Object.freeze(instance) as AggregateInstance<F, M, E>;
}

/**
 * Creates a unified aggregate method that handles all cases (with/without events,
 * with/without specifications).
 *
 * @typeParam F - The schema fields type.
 * @typeParam E - The event type.
 * @typeParam S - The specification error type.
 * @typeParam SP - The specifications type.
 * @param schema - The schema for validation.
 * @param eventStore - Optional event store.
 * @param specifications - Optional specifications.
 * @returns A function that creates aggregate instances.
 *
 * @internal
 */
function createAggregateMethod<
  F extends SchemaFields,
  E extends Event<string, Any> = Event<string, Any>,
  S = Any,
  SP extends AggregateSpecs<F, S> | undefined = undefined,
>(schema: Schema<F>, eventStore?: EventStore<E>, specifications?: SP) {
  return <M extends MethodsBuilder<F, E, S, SP>>(builder: M) => {
    type Methods = ReturnType<M>;
    type Errors = Prettify<S>;

    return (
      input: SchemaValues<F>,
      options?: AggregateInstanceOptions,
    ): Result<AggregateInstance<F, Methods, E>, Errors> => {
      const validationResult = schema(input as SchemaValues<F>);
      if (isErr(validationResult)) {
        return validationResult as Result<AggregateInstance<F, Methods, E>, Errors>;
      }

      const validatedState = validationResult.value;
      const stateManager = createStateManager<F, E, S>({
        schema,
        initialState: validatedState,
        eventStore,
        specifications: specifications ? Object.values(specifications) : undefined,
      });

      // If checkSpecs is enabled and specifications exist, validate all specs.
      if (options?.checkSpecs && specifications) {
        const specValidationResult = stateManager.validateSpecs?.();
        if (specValidationResult && isErr(specValidationResult)) {
          return specValidationResult as Result<AggregateInstance<F, Methods, E>, Errors>;
        }
      }

      const fnFunction = specifications
        ? createFnFunction<S>(specifications, stateManager)
        : createFnFunction();

      const methods = builder(stateManager, fnFunction, specifications as SP) as Methods;

      return ok(
        createAggregateInstance<F, Methods, E, S>(
          {
            schema,
            initialState: validatedState,
            eventStore,
            specifications: specifications ? Object.values(specifications) : undefined,
          },
          methods,
        ),
      );
    };
  };
}

/**
 * Creates a type-safe aggregate root builder.
 *
 * This function provides a fluent API for building aggregates with schema validation,
 * event handling, and specification-based business rules.
 *
 * @example
 * ```ts
 * // aggregate-001: Basic aggregate with schema validation.
 * const User = aggregate()
 *   .schema({
 *     name: value('User name', (value: string) => ok(value)),
 *     email: value('User email', (value: string) => ok(value)),
 *   })
 *   .methods((state, fn) => ({
 *     rename: fn('Renames the user', (newName: string) =>
 *       state.set('name', newName)
 *     )
 *   }));
 *
 * const user = User({ name: 'John', email: 'john@example.com' });
 * if (isOk(user)) {
 *   const result = user.value.rename('Jane');
 *   // unwrap(result): { name: 'Jane', email: 'john@example.com' }.
 * }
 * ```
 *
 * @example
 * ```ts
 * // aggregate-002: Aggregate with events and specifications.
 * const userEvents = eventStore({
 *   'User.Renamed': event<UserRenamed>('User renamed event', 'User.Renamed'),
 * });
 *
 * const UserMustBeActive = spec<UserSchema>('User must be active')
 *   .when(() => true)
 *   .rule('User must be active', (user) =>
 *     user.isActive ? ok(user) : err('USER_NOT_ACTIVE')
 *   )
 *   .build();
 *
 * const User = aggregate()
 *   .schema(userSchema)
 *   .specs({ UserMustBeActive })
 *   .events(userEvents)
 *   .methods((state, fn, specs) => ({
 *     rename: fn(
 *       'Renames the user',
 *       (newName: string) =>
 *         flow<string>()
 *           .map((name) => state.set('name', name))
 *           .tap((newState) => state.emit('User.Renamed', { name: newState.name }))
 *           .build()(newName),
 *       {
 *         before: specs.UserMustBeActive,
 *       },
 *     ),
 *   }));
 * ```
 *
 * @example
 * ```ts
 * // aggregate-003: Complex aggregate with multiple specifications.
 * const AdminMustBeActive = spec<UserSchema>('Admin must be active')
 *   .when(() => true)
 *   .rule('User must be admin', (user) =>
 *     user.role === 'Admin' ? ok(user) : err('NOT_ADMIN')
 *   )
 *   .rule('Admin must be active', (user) =>
 *     user.isActive ? ok(user) : err('ADMIN_NOT_ACTIVE')
 *   )
 *   .build();
 *
 * const User = aggregate()
 *   .schema(userSchema)
 *   .specs({ AdminMustBeActive })
 *   .events(userEvents)
 *   .methods((state, fn, specs) => ({
 *     makeAdmin: fn('Makes user admin', () =>
 *       state.set('role', 'Admin')
 *     , {
 *       after: specs.AdminMustBeActive
 *     })
 *   }));
 * ```
 *
 * @returns A fluent builder for creating type-safe aggregates.
 *
 * @public
 */
function aggregate() {
  return {
    /**
     * Sets the schema for the aggregate.
     *
     * @param fieldsOrSchema - The schema fields or a pre-built schema.
     * @returns A builder with schema validation capabilities.
     *
     * @example
     * ```ts
     * // aggregate-004: Schema definition with field validation.
     * const User = aggregate()
     *   .schema({
     *     name: value('User name', (value: string) =>
     *       value.length > 0 ? ok(value) : err('EMPTY_NAME'),
     *     ),
     *     email: value('User email', (value: string) =>
     *       value.includes('@') ? ok(value) : err('INVALID_EMAIL'),
     *     ),
     *     age: value('User age', (value: number) =>
     *       value >= 18 ? ok(value) : err('INVALID_AGE'),
     *     ),
     *   })
     *   .methods((state, fn) => ({
     *     updateName: fn('Updates user name', (name: string) =>
     *       state.set('name', name)
     *     )
     *   }));
     * ```
     */
    schema<F extends SchemaFields>(fieldsOrSchema: F | Schema<F>) {
      const sch = (
        isSchema(fieldsOrSchema) ? fieldsOrSchema : makeSchema(fieldsOrSchema as F)
      ) as Schema<F>;

      return {
        /**
         * Sets specifications for business rule validation.
         *
         * @param specifications - Object containing specification definitions.
         * @returns A builder with specification validation capabilities.
         *
         * @example
         * ```ts
         * // aggregate-005: Specifications for business rules.
         * const UserMustBeActive = spec<UserSchema>('User must be active')
         *   .when(() => true)
         *   .rule('User must be active', (user) =>
         *     user.isActive ? ok(user) : err('USER_NOT_ACTIVE')
         *   )
         *   .build();
         *
         * const User = aggregate()
         *   .schema(userSchema)
         *   .specs({ UserMustBeActive })
         *   .methods((state, fn, specs) => ({
         *     activate: fn(
         *       'Activates user',
         *       () => state.set('isActive', true),
         *       {
         *         after: specs.UserMustBeActive,
         *       },
         *     ),
         *   }));
         * ```
         */
        specs: <SP extends AggregateSpecs<F, Any>>(specifications: SP) => ({
          /**
           * Sets the event store for event handling.
           *
           * @param eventStoreInstance - The event store instance.
           * @returns A builder with event handling capabilities.
           *
           * @example
           * ```ts
           * // aggregate-006: Events with specifications.
           * const userEvents = eventStore({
           *   'User.Created': event<UserCreated>('User created', 'User.Created'),
           *   'User.Updated': event<UserUpdated>('User updated', 'User.Updated'),
           * });
           *
           * const User = aggregate()
           *   .schema(userSchema)
           *   .specs({ UserMustBeActive })
           *   .events(userEvents)
           *   .methods((state, fn, specs) => ({
           *     update: fn(
           *       'Updates user',
           *       (data: Partial<UserSchema>) =>
           *         flow<Partial<UserSchema>>()
           *           .map((d) => state.set('name', d.name))
           *           .tap((newState) => state.emit('User.Updated', { id: state.get('id') }))
           *           .build()(data),
           *       {
           *         before: specs.UserMustBeActive,
           *       },
           *     ),
           *   }));
           * ```
           */
          events: <E extends Event<string, Any>>(eventStoreInstance: EventStore<E>) => ({
            /**
             * Sets the methods for the aggregate.
             *
             * @param builder - Function that builds the aggregate methods.
             * @returns A function that creates aggregate instances.
             *
             * @example
             * ```ts
             * // aggregate-007: Complete aggregate with all features.
             * const User = aggregate()
             *   .schema(userSchema)
             *   .specs({ UserMustBeActive })
             *   .events(userEvents)
             *   .methods((state, fn, specs) => ({
             *     rename: fn(
             *       'Renames user',
             *       (newName: string) =>
             *         flow<string>()
             *           .map((name) => state.set('name', name))
             *           .tap((newState) => state.emit('User.Renamed', { name: newState.name }))
             *           .build()(newName),
             *       {
             *         before: specs.UserMustBeActive,
             *       },
             *     ),
             *     activate: fn(
             *       'Activates user',
             *       () => state.set('isActive', true),
             *       {
             *         after: specs.UserMustBeActive,
             *       },
             *     ),
             *   }));
             *
             * const user = User({ name: 'John', email: 'john@example.com', isActive: false });
             * if (isOk(user)) {
             *   const activated = user.value.activate();
             *   if (isOk(activated)) {
             *     // unwrap(activated): { name: 'John', email: 'john@example.com', isActive: true }.
             *   } else {
             *     // unwrap(activated): error message.
             *   }
             * }
             * ```
             */
            methods: createAggregateMethod<F, E, Any, SP>(sch, eventStoreInstance, specifications),
          }),
          /**
           * Sets the methods for the aggregate without events.
           *
           * @param builder - Function that builds the aggregate methods.
           * @returns A function that creates aggregate instances.
           *
           * @example
           * ```ts
           * // aggregate-008: Aggregate with specifications but no events.
           * const User = aggregate()
           *   .schema(userSchema)
           *   .specs({ UserMustBeActive })
           *   .methods((state, fn, specs) => ({
           *     activate: fn(
           *       'Activates user',
           *       () => state.set('isActive', true),
           *       {
           *         after: specs.UserMustBeActive,
           *       },
           *     ),
           *   }));
           * ```
           */
          methods: <M extends MethodsBuilder<F, never, Any, SP>>(builder: M) =>
            createAggregateMethod<F, never, Any, SP>(sch, undefined, specifications)(builder),
        }),
        /**
         * Sets the event store for event handling without specifications.
         *
         * @param eventStoreInstance - The event store instance.
         * @returns A builder with event handling capabilities.
         *
         * @example
         * ```ts
         * // aggregate-009: Events without specifications.
         * const userEvents = eventStore({
         *   'User.Created': event<UserCreated>('User created', 'User.Created')
         * });
         *
         * const User = aggregate()
         *   .schema(userSchema)
         *   .events(userEvents)
         *   .methods((state, fn) => ({
         *     create: fn('Creates user', (data: UserSchema) =>
         *       flow<UserSchema>()
         *         .map((d) => state.set('name', d.name))
         *         .tap((newState) => state.emit('User.Created', { name: newState.name }))
         *         .build()(data)
         *   }));
         * ```
         */
        events: <E extends Event<string, Any>>(eventStoreInstance: EventStore<E>) => ({
          /**
           * Sets the methods for the aggregate with events.
           *
           * @param builder - Function that builds the aggregate methods.
           * @returns A function that creates aggregate instances.
           *
           * @example
           * ```ts
           * // aggregate-010: Simple aggregate with events.
           * const User = aggregate()
           *   .schema(userSchema)
           *   .events(userEvents)
           *   .methods((state, fn) => ({
           *     rename: fn('Renames user', (newName: string) =>
           *       flow<string>()
           *         .map((name) => state.set('name', name))
           *         .tap((newState) => state.emit('User.Renamed', { name: newState.name }))
           *         .build()(newName)
           *   }));
           * ```
           */
          methods: createAggregateMethod<F, E>(sch, eventStoreInstance),
        }),
        /**
         * Sets the methods for the aggregate without events or specifications.
         *
         * @param builder - Function that builds the aggregate methods.
         * @returns A function that creates aggregate instances.
         *
         * @example
         * ```ts
         * // aggregate-011: Simple aggregate without events or specifications.
         * const User = aggregate()
         *   .schema(userSchema)
         *   .methods((state, fn) => ({
         *     rename: fn('Renames user', (newName: string) =>
         *       state.set('name', newName)
         *   }));
         *
         * const user = User({ name: 'John', email: 'john@example.com' });
         * if (isOk(user)) {
         *   const result = user.value.rename('Jane');
         *   if (isOk(result)) {
         *     // unwrap(result): { name: 'Jane', email: 'john@example.com' }.
         *   } else {
         *     // unwrap(result): error message.
         *   }
         * }
         * ```
         */
        methods: <M extends MethodsBuilder<F>>(builder: M) =>
          createAggregateMethod<F>(sch)(builder),
      };
    },
  };
}

export { aggregate };
