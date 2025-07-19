/*
 * This file is part of the Mixor project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { Any, Prettify } from './generics';
import { hash } from './hash';
import { Panic } from './panic';
import { type Result, err, isOk, ok } from './result';
import { type Value, isValue } from './value';

/**
 * Panic error for the schema module.
 *
 * @internal
 */
const SchemaError = Panic<
  'SCHEMA',
  // When a schema field is not a value.
  'FIELD_IS_NOT_VALUE'
>('SCHEMA');

/**
 * A schema is a record of field names and their corresponding validation functions.
 * @internal
 */
type SchemaFields = Record<string, Value<Any, Any>>;

/**
 * The type of the values of the schema.
 * @typeParam S - The schema fields.
 *
 * @internal
 */
type SchemaValues<S extends SchemaFields> = {
  [K in keyof S]: S[K] extends Value<infer T, Any> ? T : never;
};

/**
 * The type of the errors of the schema.
 * @typeParam S - The schema fields.
 *
 * @internal
 */
type SchemaErrors<S extends SchemaFields> = {
  [K in keyof S]: S[K] extends Value<Any, infer E> ? E : never;
};

/**
 * A schema that provides both object validation and individual field validation.
 * It follows the same pattern as Value, being both a function and an object with properties.
 *
 * @typeParam S - The schema fields.
 *
 * @example
 * ```ts
 * // Basic schema creation and usage.
 * const user = schema({
 *   name: value((value: string) => value.length > 0 ? ok(value) : err('EMPTY_NAME')),
 *   age: value((value: number) => value >= 0 ? ok(value) : err('INVALID_AGE')),
 * });
 *
 * // Validate entire object.
 * const validUser = user({ name: 'John Doe', age: 30 });
 * // ok({ name: 'John Doe', age: 30 }).
 *
 * // Validate individual fields.
 * const userName = user.name('John Doe'); // ok('John Doe').
 * const userAge = user.age(30); // ok(30).
 * ```
 *
 * @example
 * ```ts
 * // Schema with documentation.
 * const user = schema(
 *   'User validation schema with name and age fields',
 *   {
 *     name: value((value: string) => value.length > 0 ? ok(value) : err('EMPTY_NAME')),
 *     age: value((value: number) => value >= 0 ? ok(value) : err('INVALID_AGE')),
 *   }
 * );
 * ```
 *
 * @example
 * ```ts
 * // Schema with different validation modes.
 * const user = schema({
 *   name: value((value: string) => value.length > 0 ? ok(value) : err('EMPTY_NAME')),
 *   email: value((value: string) => value.includes('@') ? ok(value) : err('INVALID_EMAIL')),
 *   age: value((value: number) => value >= 0 ? ok(value) : err('INVALID_AGE')),
 * });
 *
 * // All mode (default) - collects all errors.
 * const allErrors = user({ name: '', email: 'invalid', age: -5 });
 * // err({ name: 'EMPTY_NAME', email: 'INVALID_EMAIL', age: 'INVALID_AGE' }).
 *
 * // Strict mode - stops at first error.
 * const strictError = user({ name: '', email: 'invalid', age: -5 }, { mode: 'strict' });
 * // err({ name: 'EMPTY_NAME' }).
 * ```
 *
 * @public
 */
type Schema<S extends SchemaFields = SchemaFields> = ((
  value: SchemaValues<S>,
  options?: SchemaOptions,
) => Result<SchemaValues<S>, SchemaErrors<S>>) & {
  readonly _tag: 'Schema';
  readonly _hash: string;
  readonly _doc?: string;
} & {
  [K in keyof S]: S[K] extends Value<infer T, infer E> ? (value: T) => Result<T, E> : never;
};

/**
 * Options for the schema validation.
 *
 * @example
 * ```ts
 * // All mode (default) - collects all validation errors.
 * const user = schema({
 *   name: value((value: string) => value.length > 0 ? ok(value) : err('EMPTY_NAME')),
 *   email: value((value: string) => value.includes('@') ? ok(value) : err('INVALID_EMAIL')),
 * });
 *
 * const result = user(
 *   { name: '', email: 'invalid' },
 *   { mode: 'all' }
 * );
 * // err({ name: 'EMPTY_NAME', email: 'INVALID_EMAIL' }).
 * ```
 *
 * @example
 * ```ts
 * // Strict mode - stops at first error for better performance.
 * const user = schema({
 *   name: value((value: string) => value.length > 0 ? ok(value) : err('EMPTY_NAME')),
 *   email: value((value: string) => value.includes('@') ? ok(value) : err('INVALID_EMAIL')),
 * });
 *
 * const result = user(
 *   { name: '', email: 'invalid' },
 *   { mode: 'strict' }
 * );
 * // err({ name: 'EMPTY_NAME' }) - stops at first error.
 * ```
 *
 * @public
 */
interface SchemaOptions {
  /**
   * The mode of schema validation.
   *
   * - 'all': The schema validation will return all errors (default).
   * - 'strict': The schema validation will stop at the first error and return the error.
   */
  mode?: 'all' | 'strict';
}

/**
 * Gets a field from the schema and throws an error if it is not a value.
 * @param field - The field to get.
 * @param schema - The schema to get the field from.
 * @returns The field function.
 *
 * @internal
 */
const getFieldOrThrow = (field: string, schema: SchemaFields) => {
  const fieldFn = schema[field];
  if (!isValue(fieldFn)) {
    throw new SchemaError('FIELD_IS_NOT_VALUE', `Field "${field}" is not a value.`);
  }
  return fieldFn;
};

/**
 * Interface for the schema function overloads.
 *
 * @public
 */
interface SchemaConstructor {
  /**
   * Creates a schema that provides both object validation and individual field validation.
   * It provides a simple interface for object validation with support for different error modes.
   *
   * @param fields - The schema object containing field validators.
   * @returns The schema function with field validators as properties.
   *
   * @example
   * ```ts
   * // Basic schema creation.
   * const user = schema({
   *   name: value((value: string) => value.length > 0 ? ok(value) : err('EMPTY_NAME')),
   *   age: value((value: number) => value >= 0 ? ok(value) : err('INVALID_AGE')),
   * });
   *
   * // Validate the entire object.
   * const validUser = user({ name: 'John Doe', age: 30 });
   * // ok({ name: 'John Doe', age: 30 }).
   *
   * // Validate a single field.
   * const userName = user.name('John Doe'); // ok('John Doe').
   * const userAge = user.age(30); // ok(30).
   * ```
   *
   * @example
   * ```ts
   * // Schema with error handling.
   * const user = schema({
   *   name: value((value: string) => value.length > 0 ? ok(value) : err('EMPTY_NAME')),
   *   age: value((value: number) => value >= 0 ? ok(value) : err('INVALID_AGE')),
   * });
   *
   * // Handle validation errors.
   * const result = user({ name: '', age: -5 });
   * if (isErr(result)) {
   *   // Do something with the validation errors.
   *   // { name: 'EMPTY_NAME', age: 'INVALID_AGE' }.
   * }
   * ```
   *
   * @example
   * ```ts
   * // Schema with TypeScript type inference.
   * const user = schema({
   *   name: value((value: string) => value.length > 0 ? ok(value) : err('EMPTY_NAME')),
   *   age: value((value: number) => value >= 0 ? ok(value) : err('INVALID_AGE')),
   * });
   *
   * // TypeScript will enforce correct input types.
   * type UserInput = InferSchema<typeof user>;
   * // type UserInput = { name: string; age: number }.
   *
   * const validateUser = (data: UserInput) => user(data);
   * ```
   *
   * @public
   */
  <F extends SchemaFields>(fields: F): Schema<F>;

  /**
   * Creates a schema that provides both object validation and individual field validation with documentation.
   * It provides a simple interface for object validation with support for different error modes.
   *
   * @param doc - Documentation of the schema being created.
   * @param fields - The schema object containing field validators.
   * @returns The schema function with field validators as properties.
   *
   * @example
   * ```ts
   * // Schema with documentation.
   * const user = schema(
   *   'User validation schema with name and age fields',
   *   {
   *     name: value((value: string) => value.length > 0 ? ok(value) : err('EMPTY_NAME')),
   *     age: value((value: number) => value >= 0 ? ok(value) : err('INVALID_AGE')),
   *   }
   * );
   * ```
   *
   * @example
   * ```ts
   * // Complex schema with documentation and multiple fields.
   * const userProfile = schema(
   *   'Complete user profile validation with comprehensive field validation',
   *   {
   *     name: value((value: string) => value.length > 0 ? ok(value) : err('EMPTY_NAME')),
   *     email: value((value: string) => value.includes('@') ? ok(value) : err('INVALID_EMAIL')),
   *     age: value((value: number) => value >= 0 ? ok(value) : err('INVALID_AGE')),
   *     password: value((value: string) => {
   *       if (value.length < 8) return err('TOO_SHORT');
   *       if (!/[A-Z]/.test(value)) return err('NO_UPPERCASE');
   *       if (!/[a-z]/.test(value)) return err('NO_LOWERCASE');
   *       if (!/\d/.test(value)) return err('NO_NUMBER');
   *       return ok(value);
   *     }),
   *   }
   * );
   *
   * const result = userProfile({
   *   name: 'John',
   *   email: 'john@example.com',
   *   age: 30,
   *   password: 'StrongP@ss123'
   * });
   * // ok({ name: 'John', email: 'john@example.com', age: 30, password: 'StrongP@ss123' }).
   * ```
   *
   * @public
   */
  <F extends SchemaFields>(doc: string, fields: F): Schema<F>;
}

/**
 * The default schema options.
 *
 * @internal
 */
const DEFAULT_SCHEMA_OPTIONS: SchemaOptions = { mode: 'all' };

/**
 * Creates a schema from a set of fields with optional documentation string.
 *
 * @param args - The arguments to create the schema.
 * @returns The schema.
 *
 * @public
 */
const schema: SchemaConstructor = <F extends SchemaFields>(...args: Any): Schema<F> => {
  const doc = typeof args[0] === 'string' ? args[0] : undefined;
  const fields = typeof args[0] === 'string' ? args[1] : args[0];

  // Create the main schema validation function.
  const schemaValidator = (
    value: SchemaValues<F>,
    options: SchemaOptions = DEFAULT_SCHEMA_OPTIONS,
  ) => {
    const { mode } = options;

    if (mode === 'strict') {
      // Stop at first error mode - more performant for early validation.
      const result: Record<string, Any> = {};

      for (const fieldName of Object.keys(fields)) {
        const fieldFn = getFieldOrThrow(fieldName, fields);
        const fieldResult = fieldFn(value[fieldName as keyof typeof value]);

        if (isOk(fieldResult)) {
          result[fieldName] = fieldResult.value;
        } else {
          // In strict mode, return immediately on first error.
          return err({ [fieldName]: fieldResult.error } as SchemaErrors<F>);
        }
      }

      return ok(result as SchemaValues<F>);
    } else {
      // All errors mode - collect all errors.
      const { result, errors, hasErrors } = Object.keys(fields).reduce(
        (acc, fieldName) => {
          const fieldFn = getFieldOrThrow(fieldName, fields);
          const fieldResult = fieldFn(value[fieldName as keyof typeof value]);

          if (isOk(fieldResult)) {
            acc.result[fieldName] = fieldResult.value;
          } else {
            acc.errors[fieldName] = fieldResult.error;
            acc.hasErrors = true;
          }

          return acc;
        },
        {
          result: {} as Record<string, Any>,
          errors: {} as Record<string, Any>,
          hasErrors: false,
        },
      );

      return hasErrors ? err(errors as SchemaErrors<F>) : ok(result as SchemaValues<F>);
    }
  };

  // Create a wrapper function that avoids conflicts with reserved properties.
  const schemaWrapper = function (value: SchemaValues<F>, options?: SchemaOptions) {
    return schemaValidator(value, options);
  };

  // Add properties to the wrapper function.
  Object.defineProperties(schemaWrapper, {
    _tag: { value: 'Schema', writable: false, enumerable: true },
    _hash: { value: hash('schema', fields), writable: false, enumerable: true },
    _doc: { value: doc, writable: false, enumerable: true },
  });

  // Add field functions as properties.
  for (const [fieldName, fieldFn] of Object.entries(fields)) {
    Object.defineProperty(schemaWrapper, fieldName, {
      value: fieldFn,
      writable: false,
      enumerable: true,
    });
  }

  return schemaWrapper as Schema<F>;
};

/**
 * Infer the type of the values of the schema.
 *
 * This utility type extracts the input types from a schema,
 * allowing you to get the expected shape of the data to validate.
 *
 * @typeParam S - The schema to infer the type from.
 *
 * @example
 * ```ts
 * // Basic type inference.
 * const user = schema({
 *   name: value((value: string) => value.length > 0 ? ok(value) : err('EMPTY_NAME')),
 *   age: value((value: number) => value >= 0 ? ok(value) : err('INVALID_AGE')),
 * });
 *
 * type UserInput = InferSchema<typeof user>;
 * // type UserInput = { name: string; age: number }.
 * ```
 *
 * @example
 * ```ts
 * // Type inference with complex schema.
 * const userProfile = schema({
 *   name: value((value: string) => value.length > 0 ? ok(value) : err('EMPTY_NAME')),
 *   email: value((value: string) => value.includes('@') ? ok(value) : err('INVALID_EMAIL')),
 *   age: value((value: number) => value >= 0 ? ok(value) : err('INVALID_AGE')),
 *   isActive: value((value: boolean) => ok(value)),
 * });
 *
 * type UserProfileInput = InferSchema<typeof userProfile>;
 * // type UserProfileInput = { name: string; email: string; age: number; isActive: boolean }.
 *
 * // Use the inferred type for type-safe validation.
 * const validateUserProfile = (data: UserProfileInput) => userProfile(data);
 * ```
 *
 * @public
 */
type InferSchema<S, F = S extends Schema<infer F> ? Prettify<SchemaValues<F>> : never> = {
  [K in keyof F]: F[K] extends SchemaValues<infer V> ? InferSchema<Schema<V>> : F[K];
};

/**
 * Guard check to determine if a value is a schema.
 * @param maybeSchema - The value to check.
 * @returns True if the value is a schema, false otherwise.
 *
 * @public
 */
const isSchema = (maybeSchema: unknown): maybeSchema is Schema<SchemaFields> => {
  return (
    !!maybeSchema &&
    typeof maybeSchema === 'function' &&
    '_tag' in maybeSchema &&
    maybeSchema._tag === 'Schema' &&
    '_hash' in maybeSchema &&
    maybeSchema._hash ===
      hash(
        'schema',
        Object.fromEntries(
          Object.entries(maybeSchema as Any).filter(
            ([key]) => key !== '_tag' && key !== '_hash' && key !== '_doc',
          ),
        ),
      ) &&
    '_doc' in maybeSchema
  );
};

export type { InferSchema, Schema, SchemaFields, SchemaValues, SchemaErrors, SchemaOptions };
export { schema, isSchema, SchemaError };
