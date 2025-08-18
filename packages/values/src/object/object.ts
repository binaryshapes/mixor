import { type Any, type SchemaErrors, type Value, rule, schema, value } from '@mixor/core';

/**
 * Creates an object value with automatic type inference.
 *
 * @remarks
 * This function is a wrapper around the {@link schema} function.
 *
 * @param fields - The fields of the object.
 * @typeParam T - The type of the object.
 * @typeParam E - The type of the error.
 * @returns A new object value.
 *
 * @public
 */
const object = <T extends Record<string, Value<Any, Any>>>(fields: T) =>
  value(rule(schema(fields))).subType('object') as Value<T, SchemaErrors<T, 'strict'>>;

export { object };
