/*
 * This file is part of the Daikit project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { Any, Prettify } from './generics';
import { type Result, err, isOk, ok } from './result';

/**
 * A function to apply to a value to validate it.
 * @param value - The value to validate.
 * @returns A result containing the validated value or an error.
 *
 * @internal
 */
type SchemaFunction<T = Any, E = Any> = (value: T) => Result<T, E>;

/**
 * A schema is a record of field names and their corresponding validation functions.
 * @internal
 */
type Schema = Record<string, SchemaFunction>;

/**
 * The type of the values of the schema.
 * @typeParam S - The schema.
 *
 * @internal
 */
type SchemaValues<S extends Schema> = Prettify<{
  [K in keyof S]: S[K] extends SchemaFunction<infer T, Any> ? T : never;
}>;

/**
 * The type of the errors of the schema.
 * @typeParam S - The schema.
 *
 * @internal
 */
type SchemaErrors<S extends Schema> = Prettify<{
  [K in keyof S]?: S[K] extends SchemaFunction<Any, infer E> ? E : never;
}>;

/**
 * A builder for a schema.
 *
 * @internal
 */
interface SchemaBuilder<S extends Schema = Schema> {
  /**
   * The fields of the schema.
   *
   * @public
   */
  fields: S;

  /**
   * Builds a function that validates the entire schema using the fields validation functions.
   *
   * @returns A function that validates a value.
   *
   * @public
   */
  build(): (
    value: SchemaValues<S>,
    options?: SchemaOptions,
  ) => Result<SchemaValues<S>, SchemaErrors<S>>;
}

/**
 * Infer the type of the values of the schema.
 *
 * This utility type extracts the input types from a schema builder,
 * allowing you to get the expected shape of the data to validate.
 *
 * @typeParam S - The schema builder to infer the type from.
 *
 * @example
 * ```ts
 * // Define a schema.
 * const userSchema = schema({
 *   name: (value: string) => value.length > 0 ? ok(value) : err('EMPTY_NAME'),
 *   age: (value: number) => value >= 0 ? ok(value) : err('INVALID_AGE'),
 * });
 *
 * // Infer the expected input type.
 * type UserInput = InferSchema<typeof userSchema>;
 * // type UserInput = { name: string; age: number }.
 *
 * // Use the inferred type.
 * const validateUser = (data: UserInput) => {
 *   const validator = userSchema.build();
 *   return validator(data);
 * };
 * ```
 *
 * @public
 */
type InferSchema<S extends SchemaBuilder<Any>> = Prettify<{
  [K in keyof S['fields']]: S['fields'][K] extends SchemaFunction<infer T, Any> ? T : never;
}>;

/**
 * Options for the schema builder.
 *
 * @example
 * ```ts
 * // All mode (default) - collects all validation errors.
 * const userSchema = schema({
 *   name: (value: string) => value.length > 0 ? ok(value) : err('EMPTY_NAME'),
 *   email: (value: string) => value.includes('@') ? ok(value) : err('INVALID_EMAIL'),
 * });
 *
 * const validator = userSchema.build();
 * const result = validator(
 *   { name: '', email: 'invalid' },
 *   { mode: 'all' }
 * );
 * // err({ name: 'EMPTY_NAME', email: 'INVALID_EMAIL' }).
 * ```
 *
 * @example
 * ```ts
 * // Strict mode - stops at first error for better performance.
 * const userSchema = schema({
 *   name: (value: string) => value.length > 0 ? ok(value) : err('EMPTY_NAME'),
 *   email: (value: string) => value.includes('@') ? ok(value) : err('INVALID_EMAIL'),
 * });
 *
 * const validator = userSchema.build();
 * const result = validator(
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
 * Creates a builder for a schema.
 *
 * A schema is a collection of field validators that can validate an entire object
 * at once, providing type-safe validation with support for different error modes.
 *
 * @param s - The schema object containing field validators.
 * @returns The schema builder.
 *
 * @example
 * ```ts
 * // Basic user schema with string and number validation.
 * const userSchema = schema({
 *   name: (value: string) => value.length > 0 ? ok(value) : err('EMPTY_NAME'),
 *   age: (value: number) => value >= 0 ? ok(value) : err('INVALID_AGE'),
 * });
 *
 * const validator = userSchema.build();
 *
 * // Valid data.
 * const validResult = validator({ name: 'John', age: 30 });
 * // ok({ name: 'John', age: 30 }).
 *
 * // Invalid data - all mode (default).
 * const invalidResult = validator({ name: '', age: -5 });
 * // err({ name: 'EMPTY_NAME', age: 'INVALID_AGE' }).
 * ```
 *
 * @example
 * ```ts
 * // Schema with different validation modes.
 * const userSchema = schema({
 *   name: (value: string) => value.length > 0 ? ok(value) : err('EMPTY_NAME'),
 *   email: (value: string) => value.includes('@') ? ok(value) : err('INVALID_EMAIL'),
 *   age: (value: number) => value >= 0 ? ok(value) : err('INVALID_AGE'),
 * });
 *
 * const validator = userSchema.build();
 *
 * // Strict mode - stops at first error.
 * const strictResult = validator(
 *   { name: '', email: 'invalid', age: -5 },
 *   { mode: 'strict' }
 * );
 * // err({ name: 'EMPTY_NAME' }) - stops at first error.
 *
 * // All mode - collects all errors.
 * const allResult = validator(
 *   { name: '', email: 'invalid', age: -5 },
 *   { mode: 'all' }
 * );
 * // err({ name: 'EMPTY_NAME', email: 'INVALID_EMAIL', age: 'INVALID_AGE' }).
 * ```
 *
 * @example
 * ```ts
 * // Schema with complex validation functions.
 * const passwordSchema = schema({
 *   password: (value: string) => {
 *     if (value.length < 8) return err('TOO_SHORT');
 *     if (!/[A-Z]/.test(value)) return err('NO_UPPERCASE');
 *     if (!/[a-z]/.test(value)) return err('NO_LOWERCASE');
 *     if (!/\d/.test(value)) return err('NO_NUMBER');
 *     return ok(value);
 *   },
 *   confirmPassword: (value: string) => {
 *     // This would need access to the original password field.
 *     // For now, just basic validation.
 *     return value.length > 0 ? ok(value) : err('EMPTY_CONFIRMATION');
 *   },
 * });
 *
 * const validator = passwordSchema.build();
 *
 * const result = validator({
 *   password: 'weak',
 *   confirmPassword: '',
 * });
 * // err({ password: 'TOO_SHORT', confirmPassword: 'EMPTY_CONFIRMATION' }).
 * ```
 *
 * @public
 */
function schema<S extends Schema>(s: S): SchemaBuilder<S> {
  return {
    fields: s,
    build() {
      return (value: SchemaValues<S>, options: SchemaOptions = { mode: 'all' }) => {
        const { mode } = options;

        if (mode === 'strict') {
          // Stop at first error mode - more performant for early validation.
          const result: Record<string, Any> = {};

          for (const fieldName of Object.keys(this.fields)) {
            const fieldResult = this.fields[fieldName](value[fieldName as keyof typeof value]);

            if (isOk(fieldResult)) {
              result[fieldName] = fieldResult.value;
            } else {
              // In strict mode, return immediately on first error.
              return err({ [fieldName]: fieldResult.error } as SchemaErrors<S>);
            }
          }

          return ok(result as SchemaValues<S>);
        } else {
          // All errors mode - collect all errors.
          const { result, errors, hasErrors } = Object.keys(this.fields).reduce(
            (acc, fieldName) => {
              const fieldResult = this.fields[fieldName](value[fieldName as keyof typeof value]);

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

          return hasErrors ? err(errors as SchemaErrors<S>) : ok(result as SchemaValues<S>);
        }
      };
    },
  };
}

export type { InferSchema };
export { schema };
