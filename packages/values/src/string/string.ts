import { type Any, type ResultError, type Rule, value } from '@mixor/core';

/**
 * Result base error type for string values rules.
 *
 * @remarks
 * This error type is used to represent the error that occurs when a string value is not valid.
 * It is a base error type for all string value errors.
 *
 * @public
 */
type StringValueError<C extends string, O extends string> = ResultError<C, 'StringValue', O>;

/**
 * Creates a string value with automatic type inference for tracing.
 *
 * @param rules - The validation rules to apply to the string value.
 * @returns A new string value.
 *
 * @public
 */
const string = <T extends Rule<string, Any>[]>(...rules: T) => value<T>(...rules).subType('string');

export type { StringValueError };
export { string };
