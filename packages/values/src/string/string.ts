import { type Any, type ResultError, type Rule, value } from '@mixor/core';

/**
 * Result base error type for string values rules.
 *
 * @remarks
 * This error type represents validation errors that occur when a string value is not valid.
 * It serves as the base error type for all string value validation rules.
 *
 * @public
 */
type StringValueError<C extends string, O extends string> = ResultError<C, 'StringValue', O>;

/**
 * Creates a string value with automatic type inference for tracing.
 *
 * @param rules - The validation rules to apply to the string value.
 * @returns A new string value with the specified validation rules.
 *
 * @public
 */
const string = <T extends Rule<string, Any>[]>(...rules: T) => {
  // Apply the subType "string" to the rules.
  for (const rule of rules) {
    rule.subType('string');
  }

  return value<T>(...rules).subType('string');
};

export type { StringValueError };
export { string };
