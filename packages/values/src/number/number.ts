import { type Any, type ResultError, type Rule, value } from '@mixor/core';

/**
 * Result base error type for number values rules.
 *
 * @remarks
 * This error type represents validation errors that occur when a number value is not valid.
 * It serves as the base error type for all number value validation rules.
 *
 * @public
 */
type NumberValueError<C extends string, O extends string> = ResultError<C, 'NumberValue', O>;

/**
 * Creates a number value with automatic type inference for tracing.
 *
 * @param rules - The validation rules to apply to the number value.
 * @returns A new number value with the specified validation rules.
 *
 * @public
 */
const number = <T extends Rule<number, Any>[]>(...rules: T) => {
  // Apply the subType "number" to the rules.
  for (const rule of rules) {
    rule.subType('number');
  }

  return value<T>(...rules).subType('number');
};

export type { NumberValueError };
export { number };
