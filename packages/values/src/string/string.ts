import { type Any, type Rule, value } from '@mixor/core';

/**
 * Creates a string value with automatic type inference for tracing.
 *
 * @param rules - The validation rules to apply to the string value.
 * @returns A new string value.
 *
 * @public
 */
const string = <T extends Rule<string, Any>[]>(...rules: T) => value<T>(...rules).subType('string');

export { string };
