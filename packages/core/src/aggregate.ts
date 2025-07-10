/*
 * This file is part of the Daikit project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
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
 *
 * @public
 */
type MethodsBuilder<F extends SchemaFields = SchemaFields> = (
  self: AggregateStateManager<F>,
) => Record<string, (...args: Any[]) => Any>;

/**
 * Type-safe state manager for aggregates that encapsulates state and provides validation.
 * This is used internally by the aggregate creator to define methods.
 *
 * @typeParam F - The schema fields type for proper error typing and state inference.
 *
 * @public
 */
interface AggregateStateManager<F extends SchemaFields = SchemaFields> {
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
}

/**
 * Type-safe aggregate instance that exposes only the public interface.
 * This is what the end user gets - only getState() and the defined methods.
 *
 * @typeParam F - The schema fields type.
 * @typeParam M - The methods type.
 *
 * @public
 */
type AggregateInstance<F extends SchemaFields, M> = M & {
  /**
   * Gets the current state as a readonly object.
   * This is the only way for end users to access the aggregate state.
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
  getState(): Readonly<Prettify<SchemaValues<F>>>;
};

/**
 * Helper type to extract the state type from a schema.
 * This allows you to define explicit state types for better type safety.
 *
 * @typeParam S - The schema type.
 *
 * @example
 * ```ts
 * const userSchema = schema({
 *   name: value((value: string) => value.length > 0 ? ok(value) : err('EMPTY_NAME')),
 *   age: value((value: number) => value >= 0 ? ok(value) : err('INVALID_AGE')),
 * });
 *
 * type UserState = InferAggregateState<typeof userSchema>;
 * // type UserState = { name: string; age: number }
 * ```
 *
 * @public
 */
type InferAggregateState<S> = S extends Schema<infer F> ? Prettify<SchemaValues<F>> : never;

/**
 * Helper type to extract the error types from a schema.
 * This allows you to define explicit error types for better type safety.
 *
 * @typeParam S - The schema type.
 *
 * @example
 * ```ts
 * const userSchema = schema({
 *   name: value((value: string) => value.length > 0 ? ok(value) : err('EMPTY_NAME')),
 *   age: value((value: number) => value >= 0 ? ok(value) : err('INVALID_AGE')),
 * });
 *
 * type UserErrors = InferAggregateErrors<typeof userSchema>;
 * // type UserErrors = { name: 'EMPTY_NAME'; age: 'INVALID_AGE' }
 * ```
 *
 * @public
 */
type InferAggregateErrors<S> = S extends Schema<infer F> ? Prettify<SchemaErrors<F>> : never;

/**
 * Type for a strongly-typed aggregate with explicit state and methods types.
 * This allows you to define clean, specific types for your aggregates.
 *
 * @typeParam State - The explicit state type.
 * @typeParam Methods - The explicit methods type.
 * @typeParam Errors - The explicit error types from the schema.
 *
 * @example
 * ```ts
 * type UserState = {
 *   id: string;
 *   name: string;
 *   email: string;
 * };
 *
 * type UserMethods = {
 *   rename: (newName: UserState['name']) => Result<void, 'EMPTY_NAME'>;
 *   changeEmail: (newEmail: UserState['email']) => Result<void, 'EMPTY_EMAIL'>;
 * };
 *
 * type UserErrors = {
 *   id: 'EMPTY_ID';
 *   name: 'EMPTY_NAME';
 *   email: 'EMPTY_EMAIL';
 * };
 *
 * const User: Aggregate<UserState, UserMethods, UserErrors> = aggregateRoot()
 *   .schema(userSchema)
 *   .methods((state) => ({
 *     rename: (newName) => state.set('name', newName),
 *     changeEmail: (newEmail) => state.set('email', newEmail),
 *   }));
 * ```
 *
 * @example
 * ```ts
 * // Using inferred errors from schema
 * const User: Aggregate<UserState, UserMethods, InferAggregateErrors<typeof userSchema>> = aggregateRoot()
 *   .schema(userSchema)
 *   .methods((state) => ({ ... }));
 * ```
 *
 * @public
 */
type Aggregate<State, Methods, Errors> = {
  create(input: State): Result<Prettify<Methods & { getState(): Readonly<State> }>, Errors>;
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
 *   // Safe state access
 *   const name = user.get('name'); // string
 *   const age = user.get('age');   // number
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
 * // Direct state access is not possible
 * // user.name = 'Invalid'; // TypeScript error
 * // user.age = -5;         // TypeScript error
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
        methods<M extends MethodsBuilder<F>>(builder: M) {
          type Methods = ReturnType<M>;
          type Aggregate = AggregateInstance<F, Methods>;

          return {
            create(input: State): Result<Aggregate, Prettify<SchemaErrors<F>>> {
              // Validate initial input.
              const validationResult = sch(input as SchemaValues<F>);
              if (isErr(validationResult)) {
                return validationResult as Result<Aggregate, Prettify<SchemaErrors<F>>>;
              }

              const validatedState = unwrap(validationResult) as State;
              const stateManager = createStateManager<F>(sch, validatedState as SchemaValues<F>);
              const methods = builder(stateManager);

              // Create the aggregate instance with only the public interface
              const aggregate = {
                ...methods,
                getState: () => stateManager.getState() as Readonly<Prettify<SchemaValues<F>>>,
              } as Aggregate;

              return ok(aggregate);
            },
          };
        },
      };
    },
  };
}

/**
 * Creates a state manager that encapsulates the aggregate state and provides type-safe access.
 *
 * @typeParam F - The schema fields type.
 * @param schema - The schema for validation.
 * @param initialState - The initial state.
 * @returns A state manager with get, set, and getState methods.
 *
 * @internal
 */
function createStateManager<F extends SchemaFields>(
  schema: Schema<F>,
  initialState: SchemaValues<F>,
): AggregateStateManager<F> {
  let state = { ...initialState };

  return {
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
}

export { aggregateRoot };
export type {
  MethodsBuilder,
  AggregateStateManager,
  AggregateInstance,
  InferAggregateState,
  InferAggregateErrors,
  Aggregate,
};
