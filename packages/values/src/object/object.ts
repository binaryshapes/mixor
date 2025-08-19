import {
  type Any,
  type SchemaErrors,
  type SchemaValues,
  type Value,
  rule,
  schema,
  value,
} from '@mixor/core';

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
const object = <T extends Record<string, Value<Any, Any>>>(fields: T) => {
  // Create a unique schema instance for each call.
  const schemaInstance = schema(fields);

  // Create a unique rule instance for each call.
  const ruleInstance = rule((value: Any) => schemaInstance(value)).subType('object');

  // Create a unique value instance for each call.
  return value(ruleInstance).subType('object') as unknown as Value<
    SchemaValues<T>,
    SchemaErrors<T, 'all'>
  >;
};

export { object };
