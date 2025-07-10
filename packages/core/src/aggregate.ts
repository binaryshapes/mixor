/*
 * This file is part of the Daikit project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { type Event, type EventStore } from './event';
import type { Any, Prettify } from './generics';
import { type Result, isErr, ok, unwrap } from './result';
import {
  type Schema,
  type SchemaErrors,
  type SchemaFields,
  type SchemaValues,
  isSchema,
  schema as makeSchema,
} from './schema';

/**
 * Type for methods builder function that receives the aggregate state manager and returns methods.
 *
 * @typeParam F - The schema fields type.
 * @typeParam E - The event types union.
 *
 * @public
 */
type MethodsBuilder<
  F extends SchemaFields = SchemaFields,
  E extends Event<string, Any> = Event<string, Any>,
> = (self: AggregateStateManager<F, E>) => Record<string, (...args: Any[]) => Any>;

/**
 * Type-safe state manager for aggregates that encapsulates state and provides validation.
 * This is used internally by the aggregate creator to define methods.
 *
 * @typeParam F - The schema fields type for proper error typing and state inference.
 * @typeParam E - The event types union for type-safe event emission.
 *
 * @public
 */
interface AggregateStateManager<
  F extends SchemaFields = SchemaFields,
  E extends Event<string, Any> = Event<string, Any>,
> {
  /**
   * Gets a property value from the aggregate state.
   *
   * @typeParam K - The key of the property to get.
   * @param key - The property key.
   * @returns The value of the property.
   *
   * @example
   * ```ts
   * const name = user.get('name'); // string
   * const age = user.get('age');   // number
   * ```
   *
   * @public
   */
  get<K extends keyof SchemaValues<F>>(key: K): SchemaValues<F>[K];

  /**
   * Sets a property value in the aggregate state with automatic validation.
   *
   * @typeParam K - The key of the property to set.
   * @param key - The property key.
   * @param value - The new value to set.
   * @returns A Result with the updated state on success or validation error.
   *
   * @example
   * ```ts
   * const result = user.set('name', 'Charlie');
   * if (isOk(result)) {
   *   console.log('Name updated successfully, new state:', unwrap(result));
   * } else {
   *   console.log('Validation error:', unwrap(result));
   * }
   * ```
   *
   * @public
   */
  set<K extends keyof SchemaValues<F> & keyof F>(
    key: K,
    value: SchemaValues<F>[K],
  ): Result<Prettify<SchemaValues<F>>, SchemaErrors<F>[K]>;

  /**
   * Gets the current state as a readonly object.
   * This is useful for creating copies or serializing the aggregate.
   *
   * @returns A readonly copy of the current state.
   *
   * @example
   * ```ts
   * const state = user.getState();
   * console.log(state.name, state.age);
   * ```
   *
   * @public
   */
  getState(): Readonly<SchemaValues<F>>;

  /**
   * Emits an event to the aggregate's event store.
   * This allows aggregates to publish domain events when state changes occur.
   *
   * @typeParam K - The event key type.
   * @param key - The event key.
   * @param value - The event value.
   * @returns The created event.
   *
   * @example
   * ```ts
   * // Emit a user renamed event.
   * const event = state.emit('user.renamed', { name: 'Charlie' });
   * console.log(event.key); // 'user.renamed'
   * console.log(event.value.name); // 'Charlie'
   * ```
   *
   * @public
   */
  emit<K extends E['key']>(key: K, value: Extract<E, { key: K }>['value']): Extract<E, { key: K }>;

  /**
   * Gets all events emitted by this aggregate instance.
   * This is useful for event sourcing or auditing purposes.
   *
   * @returns Array of all events emitted by this aggregate.
   *
   * @example
   * ```ts
   * const events = state.getEvents();
   * console.log(events.length); // Number of events emitted
   * ```
   *
   * @public
   */
  getEvents(): E[];

  /**
   * Pulls all events from the aggregate's event store and clears them.
   * This is useful for processing events and then clearing the store.
   *
   * @returns Array of all events that were in the store.
   *
   * @example
   * ```ts
   * const events = state.pullEvents();
   * // events contains all emitted events
   * // event store is now empty
   * ```
   *
   * @public
   */
  pullEvents(): E[];
}

/**
 * Type-safe aggregate instance that exposes only the public interface.
 * This is what the end user gets - only getState() and the defined methods.
 * State properties are also available as readonly properties for direct access.
 *
 * @typeParam F - The schema fields type.
 * @typeParam M - The methods type.
 * @typeParam E - The event types union.
 *
 * @public
 */
type AggregateInstance<
  F extends SchemaFields,
  M,
  E extends Event<string, Any> = Event<string, Any>,
> = Prettify<
  Readonly<SchemaValues<F>> &
    M & {
      /**
       * Gets all events emitted by this aggregate instance.
       * This is useful for event sourcing or auditing purposes.
       *
       * @returns Array of all events emitted by this aggregate.
       *
       * @example
       * ```ts
       * const events = user.getEvents();
       * console.log(events.length); // Number of events emitted
       * ```
       *
       * @public
       */
      getEvents(): E[];

      /**
       * Pulls all events from the aggregate's event store and clears them.
       * This is useful for processing events and then clearing the store.
       *
       * @returns Array of all events that were in the store.
       *
       * @example
       * ```ts
       * const events = user.pullEvents();
       * // events contains all emitted events
       * // event store is now empty
       * ```
       *
       * @public
       */
      pullEvents(): E[];
    }
>;

/**
 * Interface for the state manager factory function with overloads.
 * This allows for different function signatures based on whether event support is needed.
 *
 * @internal
 */
interface CreateStateManager {
  /**
   * Creates a state manager without event support.
   *
   * @typeParam F - The schema fields type.
   * @param schema - The schema for validation.
   * @param initialState - The initial state.
   * @returns A state manager with get, set, and getState methods.
   */
  <F extends SchemaFields>(
    schema: Schema<F>,
    initialState: SchemaValues<F>,
  ): AggregateStateManager<F>;

  /**
   * Creates a state manager with event support.
   *
   * @typeParam F - The schema fields type.
   * @typeParam E - The event types union.
   * @param schema - The schema for validation.
   * @param initialState - The initial state.
   * @param eventStoreInstance - The event store instance.
   * @returns A state manager with get, set, getState, and event methods.
   */
  <F extends SchemaFields, E extends Event<string, Any>>(
    schema: Schema<F>,
    initialState: SchemaValues<F>,
    eventStoreInstance: EventStore<E>,
  ): AggregateStateManager<F, E>;
}

/**
 * Creates a state manager that encapsulates the aggregate state and provides type-safe access.
 * This function supports both event and non-event scenarios through function overloads.
 *
 * @typeParam F - The schema fields type.
 * @typeParam E - The event types union (optional).
 * @param schema - The schema for validation.
 * @param initialState - The initial state.
 * @param eventStoreInstance - The event store instance (optional).
 * @returns A state manager with appropriate methods based on whether events are supported.
 *
 * @internal
 */
const createStateManager: CreateStateManager = <
  F extends SchemaFields,
  E extends Event<string, Any> = Event<string, Any>,
>(
  schema: Schema<F>,
  initialState: SchemaValues<F>,
  eventStoreInstance?: EventStore<E>,
): AggregateStateManager<F, E> => {
  let state = { ...initialState };

  const baseManager = {
    get<K extends keyof SchemaValues<F>>(key: K): SchemaValues<F>[K] {
      return state[key];
    },

    set<K extends keyof SchemaValues<F> & keyof F>(
      key: K,
      value: SchemaValues<F>[K],
    ): Result<Prettify<SchemaValues<F>>, SchemaErrors<F>[K]> {
      // Validate the specific field using the schema.
      // The schema object has field validators as properties.
      const fieldSchema = (schema as Record<string, Any>)[key as string];
      if (fieldSchema && typeof fieldSchema === 'function') {
        const validationResult = fieldSchema(value) as Result<void, SchemaErrors<F>[K]>;
        if (isErr(validationResult)) {
          return validationResult;
        }
      }

      // If validation passes, update the state.
      state = { ...state, [key]: value };
      return ok(state as Prettify<SchemaValues<F>>);
    },

    getState(): Readonly<SchemaValues<F>> {
      return Object.freeze({ ...state });
    },
  };

  // If no event store is provided, return base manager without event methods.
  if (!eventStoreInstance) {
    return baseManager as AggregateStateManager<F, E>;
  }

  // Return manager with event support.
  return {
    ...baseManager,
    emit<K extends E['key']>(
      key: K,
      value: Extract<E, { key: K }>['value'],
    ): Extract<E, { key: K }> {
      return eventStoreInstance.add(key, value) as Extract<E, { key: K }>;
    },

    getEvents(): E[] {
      return eventStoreInstance.list();
    },

    pullEvents(): E[] {
      return eventStoreInstance.pull();
    },
  };
};

/**
 * Creates a type-safe aggregate root builder.
 *
 * This function provides a fluent, type-safe API for defining aggregates with schemas and methods.
 * It follows the Domain-Driven Design pattern for aggregate roots.
 *
 * The aggregate state is encapsulated and can only be accessed/modified through type-safe methods.
 * All state modifications are automatically validated using the schema.
 *
 * @returns A type-safe aggregate root builder that can be chained with schema and methods.
 *
 * @example
 * ```ts
 * // Type-safe aggregate creation with fluent API using schema fields.
 * const User = aggregateRoot()
 *   .schema({
 *     name: value((value: string) => value.length > 0 ? ok(value) : err('EMPTY_NAME')),
 *     age: value((value: number) => value >= 0 ? ok(value) : err('INVALID_AGE')),
 *   })
 *   .methods((self) => ({
 *     rename: (newName: string) => {
 *       return self.set('name', newName);
 *     },
 *     celebrateBirthday: () => {
 *       const currentAge = self.get('age');
 *       return self.set('age', currentAge + 1);
 *     },
 *     getInfo: () => {
 *       const name = self.get('name');
 *       const age = self.get('age');
 *       return `${name} is ${age} years old`;
 *     },
 *   }));
 *
 * // TypeScript will enforce correct input types.
 * const userResult = User.create({ name: 'Bob', age: 30 });
 * if (isOk(userResult)) {
 *   const user = unwrap(userResult);
 *
 *   // Direct state access (readonly properties)
 *   const name = user.name; // string
 *   const age = user.age;   // number
 *
 *   // Alternative: getState() method
 *   const state = user.getState();
 *   console.log(state.name, state.age);
 *
 *   // Safe state modification with validation
 *   const renameResult = user.rename('Charlie');
 *   if (isOk(renameResult)) {
 *     console.log('Name updated successfully');
 *   } else {
 *     console.log('Validation error:', unwrap(renameResult));
 *   }
 * } else {
 *   console.log('Creation failed:', unwrap(userResult));
 * }
 *
 * // Direct state modification is not possible (readonly properties)
 * // user.name = 'Invalid'; // TypeScript error and runtime error
 * // user.age = -5;         // TypeScript error and runtime error
 * ```
 *
 * @example
 * ```ts
 * // Type-safe aggregate creation with pre-defined schema.
 * const userSchema = schema({
 *   name: value((value: string) => value.length > 0 ? ok(value) : err('EMPTY_NAME')),
 *   age: value((value: number) => value >= 0 ? ok(value) : err('INVALID_AGE')),
 * });
 *
 * const User = aggregateRoot()
 *   .schema(userSchema)
 *   .methods((self) => ({
 *     rename: (newName: string) => {
 *       return self.set('name', newName);
 *     },
 *     celebrateBirthday: () => {
 *       const currentAge = self.get('age');
 *       return self.set('age', currentAge + 1);
 *     },
 *   }));
 *
 * // Same type safety and validation as above.
 * const userResult = User.create({ name: 'Bob', age: 30 });
 * ```
 *
 * @example
 * ```ts
 * // Type-safe aggregate creation with events.
 * type UserCreated = Event<'user.created', { email: string; name: string }>;
 * type UserRenamed = Event<'user.renamed', { name: string }>;
 * type UserPasswordChanged = Event<'user.password_changed', { email: string }>;
 *
 * const userEventStore = eventStore<UserCreated | UserRenamed | UserPasswordChanged>();
 *
 * const User = aggregateRoot()
 *   .schema(userSchema)
 *   .events(userEventStore)
 *   .methods((state) => ({
 *     rename: flow<string>()
 *       .map((newName) => state.set('name', newName))
 *       .tap(() => state.emit('user.renamed', { name: newName }))
 *       .build(),
 *   }));
 * ```
 *
 * @public
 */
function aggregateRoot() {
  return {
    schema<F extends SchemaFields>(fieldsOrSchema: F | Schema<F>) {
      const sch = (
        isSchema(fieldsOrSchema) ? fieldsOrSchema : makeSchema(fieldsOrSchema as F)
      ) as Schema<F>;
      type State = Prettify<SchemaValues<F>>;
      return {
        events<E extends Event<string, Any>>(eventStoreInstance: EventStore<E>) {
          return {
            methods<M extends MethodsBuilder<F, E>>(builder: M) {
              type Methods = ReturnType<M>;
              type Errors = Prettify<SchemaErrors<F>>;

              const aggregate = (
                input: State,
              ): Result<AggregateInstance<F, Methods, E>, Errors> => {
                // Validate initial input.
                const validationResult = sch(input as SchemaValues<F>);
                if (isErr(validationResult)) {
                  return validationResult as Result<AggregateInstance<F, Methods, E>, Errors>;
                }

                const validatedState = unwrap(validationResult) as SchemaValues<F>;
                const stateManager = createStateManager<F, E>(
                  sch,
                  validatedState,
                  eventStoreInstance,
                );
                const methods = builder(stateManager);

                // Create the aggregate instance with public interface and readonly state properties.
                const instance = {
                  ...stateManager.getState(),
                  getEvents: () => stateManager.getEvents(),
                  pullEvents: () => stateManager.pullEvents(),
                  ...methods,
                };

                // Freeze the instance of the aggregate.
                return ok(Object.freeze(instance) as AggregateInstance<F, Methods, E>);
              };

              return aggregate;
            },
          };
        },
        methods<M extends MethodsBuilder<F>>(builder: M) {
          type Methods = ReturnType<M>;
          type Errors = Prettify<SchemaErrors<F>>;

          const aggregate = (input: State): Result<AggregateInstance<F, Methods>, Errors> => {
            // Validate initial input.
            const validationResult = sch(input as SchemaValues<F>);
            if (isErr(validationResult)) {
              return validationResult as Result<AggregateInstance<F, Methods>, Errors>;
            }

            const validatedState = unwrap(validationResult) as SchemaValues<F>;
            const stateManager = createStateManager<F>(sch, validatedState);
            const methods = builder(stateManager);

            // Create the aggregate instance with public interface and readonly state properties.
            const instance = {
              ...stateManager.getState(),
              ...methods,
            };

            // Freeze the instance of the aggregate.
            return ok(Object.freeze(instance) as AggregateInstance<F, Methods>);
          };

          return aggregate;
        },
      };
    },
  };
}

export { aggregateRoot };
