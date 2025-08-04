/*
 * This file is part of the Mixor project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { ApplyErrorMode, ErrorMode } from './_err';
import type { Any, Prettify } from './generics';
import { Panic } from './panic';
import { type Result, err, isOk, ok } from './result';
import { type Traceable, type TraceableMeta, isTraceable, traceInfo, traceable } from './trace';
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
 * Extended metadata for schema validation.
 *
 * @internal
 */
type SchemaMeta = TraceableMeta<{
  /** Example of valid schema object. */
  example: string;
}>;

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
type SchemaValues<S> = Prettify<{
  [K in keyof S]: S[K] extends Value<infer T, Any> ? T : never;
}>;

/**
 * The type of the errors of the schema.
 * Uses the centralized error mode concept from {@link ErrorMode}.
 * @typeParam S - The schema fields.
 * @typeParam Mode - The error mode.
 *
 * @internal
 */
type SchemaErrors<S, Mode extends ErrorMode> = Prettify<{
  [K in keyof S]: S[K] extends Value<Any, infer E> ? ApplyErrorMode<E, Mode> : never;
}>;

/**
 * Type constraint to ensure all properties in a record are Value types.
 * This preserves type inference while enforcing the constraint.
 *
 * @typeParam T - The record type to validate.
 *
 * @internal
 */
type EnsureAllValues<T> = Prettify<{
  [K in keyof T]: T[K] extends Value<Any, Any> ? T[K] : never;
}>;

/**
 * This function ensures to executes all value validators defined in the schema.
 * The result is a record of the values and errors.
 * Uses the centralized error mode concept from {@link ErrorMode}.
 *
 * @typeParam F - The schema fields.
 * @typeParam V - The schema values.
 *
 * @internal
 */
type SchemaFunction<F, V = SchemaValues<F>> = {
  /**
   * Validates the schema with the given value and optional error mode.
   *
   * @remarks
   * - `'strict'`: Stops at the first error and returns the error.
   * - `'all'`: Collects all errors and returns an object with the details of each field error.
   * - Default: Uses 'all' mode if no mode is specified.
   *
   * @param value - The value to validate.
   * @param mode - The error mode to use for validation.
   * @returns A result containing the validated value or an error.
   */
  <Mode extends ErrorMode = 'all'>(value: V, mode?: Mode): Result<V, SchemaErrors<F, Mode>>;
};

/**
 * A schema that provides both object validation and individual field validation.
 * It follows the same pattern as Value, being both a function and an object with properties.
 *
 * @typeParam S - The schema fields.
 *
 * @public
 */
type Schema<F> = Traceable<'Schema', SchemaFunction<F>, SchemaMeta> & {
  [K in keyof F]: F[K] extends Value<Any, Any> ? F[K] : never;
};

/**
 * Creates a schema from a set of fields.
 *
 * @typeParam F - The schema fields type.
 * @param fields - The schema object containing field validators.
 * @returns The schema function with field validators as properties.
 *
 * @example
 * ```ts
 * // schema-001: Basic schema creation and validation.
 * const NameNotEmpty = rule((name: string) =>
 *   name.length > 0 ? ok(name) : err('EMPTY_NAME')
 * );
 * const AgeValid = rule((age: number) =>
 *   age >= 0 ? ok(age) : err('INVALID_AGE')
 * );
 *
 * const NameValidator = value(NameNotEmpty);
 * const AgeValidator = value(AgeValid);
 *
 * const UserSchema = schema({
 *   name: NameValidator,
 *   age: AgeValidator,
 * });
 *
 * const validUser = UserSchema({ name: 'John Doe', age: 30 });
 * // validUser: ok({ name: 'John Doe', age: 30 }).
 *
 * const invalidUser = UserSchema({ name: '', age: -5 });
 * // invalidUser: err({ name: ['EMPTY_NAME'], age: ['INVALID_AGE'] }).
 * ```
 *
 * @example
 * ```ts
 * // schema-002: Individual field validation.
 * const NameValidator = value(
 *   rule((name: string) => name.length > 0 ? ok(name) : err('EMPTY_NAME'))
 * );
 * const AgeValidator = value(
 *   rule((age: number) => age >= 0 ? ok(age) : err('INVALID_AGE'))
 * );
 *
 * const UserSchema = schema({
 *   name: NameValidator,
 *   age: AgeValidator,
 * });
 *
 * const nameResult = UserSchema.name('John Doe');
 * // nameResult: ok('John Doe').
 *
 * const ageResult = UserSchema.age(25);
 * // ageResult: ok(25).
 *
 * const invalidName = UserSchema.name('');
 * // invalidName: err(['EMPTY_NAME']).
 * ```
 *
 * @example
 * ```ts
 * // schema-003: Schema with metadata and tracing.
 * const UserSchema = schema({
 *   name: value(
 *     rule((name: string) => name.length > 0 ? ok(name) : err('EMPTY_NAME'))
 *   ),
 *   email: value(
 *     rule((email: string) => email.includes('@') ? ok(email) : err('INVALID_EMAIL'))
 *   ),
 * }).meta({
 *   name: 'UserSchema',
 *   description: 'User validation schema with name and email',
 *   scope: 'UserValidation',
 *   example: '{ "name": "John Doe", "email": "john@example.com" }'
 * });
 * ```
 *
 * @example
 * ```ts
 * // schema-004: Strict vs All validation modes.
 * const UserSchema = schema({
 *   name: value(
 *     rule((name: string) => name.length > 0 ? ok(name) : err('EMPTY_NAME'))
 *   ),
 *   email: value(
 *     rule((email: string) => email.includes('@') ? ok(email) : err('INVALID_EMAIL'))
 *   ),
 *   age: value(
 *     rule((age: number) => age >= 0 ? ok(age) : err('INVALID_AGE'))
 *   ),
 * });
 *
 * const invalidData = { name: '', email: 'invalid', age: -5 };
 *
 * // All mode (default) - collects all errors
 * const allErrors = UserSchema(invalidData, 'all');
 * // allErrors: err({ name: ['EMPTY_NAME'], email: ['INVALID_EMAIL'], age: ['INVALID_AGE'] }).
 *
 * // Strict mode - stops at first error
 * const strictError = UserSchema(invalidData, 'strict');
 * // strictError: err({ name: ['EMPTY_NAME'] }).
 * ```
 *
 * @public
 */
const schema = <F extends Record<string, Any>>(fields: EnsureAllValues<F>): Schema<F> => {
  // Validate that all fields are values during schema creation.
  if (Object.values(fields).some((f) => !isValue(f))) {
    throw new SchemaError('FIELD_IS_NOT_VALUE', 'All fields must be values.');
  }

  // Create the main schema validation function.
  const schemaValidator = (value: SchemaValues<F>, mode = 'all') => {
    if (mode === 'strict') {
      // Stop at first error mode - more performant for early validation.
      const result: Record<string, Any> = {};

      for (const fieldName of Object.keys(fields)) {
        const fieldFn = (fields as Record<string, Any>)[fieldName];
        const fieldResult = fieldFn(value[fieldName as keyof typeof value], mode);

        if (isOk(fieldResult)) {
          result[fieldName] = fieldResult.value;
        } else {
          // In strict mode, return immediately on first error.
          return err({ [fieldName]: fieldResult.error });
        }
      }

      return ok(result);
    } else {
      // All errors mode - collect all errors.
      const { result, errors, hasErrors } = Object.keys(fields).reduce(
        (acc, fieldName) => {
          const fieldFn = (fields as Record<string, Any>)[fieldName];
          const fieldResult = fieldFn(value[fieldName as keyof typeof value], mode);

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

      return hasErrors ? err(errors) : ok(result);
    }
  };

  // Create a traceable schema function.
  const traceableSchema = traceable('Schema', schemaValidator) as Schema<F>;

  // Add field functions as properties.
  for (const [fieldName, fieldFn] of Object.entries(fields)) {
    Object.defineProperty(traceableSchema, fieldName, {
      value: fieldFn,
      writable: false,
      enumerable: true,
    });
  }

  return traceableSchema;
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
 * // schema-005: Type inference with schema.
 * const UserSchema = schema({
 *   name: value(
 *     rule((name: string) => name.length > 0 ? ok(name) : err('EMPTY_NAME'))
 *   ),
 *   age: value(
 *     rule((age: number) => age >= 0 ? ok(age) : err('INVALID_AGE'))
 *   ),
 *   email: value(
 *     rule((email: string) => email.includes('@') ? ok(email) : err('INVALID_EMAIL'))
 *   ),
 * });
 *
 * type UserInput = InferSchema<typeof UserSchema>;
 * // type UserInput = { name: string; age: number; email: string }.
 *
 * // Use the inferred type for type-safe validation
 * const validateUser = (data: UserInput) => UserSchema(data);
 *
 * const validationResult = validateUser(testData);
 * ```
 *
 * @public
 */
type InferSchema<S, F = S extends Schema<infer F> ? SchemaValues<F> : never> = Prettify<{
  [K in keyof F]: F[K] extends SchemaValues<infer V> ? InferSchema<Schema<V>> : F[K];
}>;

/**
 * Guard check to determine if the given object is a schema.
 * @param maybeSchema - The object to check.
 * @returns True if the object is a schema, false otherwise.
 *
 * @example
 * ```ts
 * // schema-006: Check if object is a schema.
 * const UserSchema = schema({
 *   name: value(
 *     rule((name: string) => name.length > 0 ? ok(name) : err('EMPTY_NAME'))
 *   ),
 * });
 *
 * const isUserSchema = isSchema(UserSchema);
 * // isUserSchema: true.
 *
 * const isNotSchema = isSchema({ name: 'test' });
 * // isNotSchema: false.
 * ```
 *
 * @public
 */
const isSchema = (maybeSchema: unknown): maybeSchema is Schema<Any> =>
  isTraceable(maybeSchema) && traceInfo(maybeSchema as Schema<Any>).tag === 'Schema';

export type { InferSchema, Schema, SchemaFields, SchemaValues, SchemaErrors };
export { schema, isSchema, SchemaError };
