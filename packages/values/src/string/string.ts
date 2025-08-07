import { type ErrorMode, type Value, type ValueRule, pipe, traceable } from '@mixor/core';

/**
 * Creates a string value with automatic type inference for tracing.
 *
 * @param rules - The validation rules to apply to the string value.
 * @returns A new traceable string value.
 *
 * @public
 */
const string = <E>(...rules: ValueRule<string, E>[]) =>
  traceable(
    'Value',
    (value: string, mode: ErrorMode = 'all') =>
      pipe(mode, ...(rules as [ValueRule<string, E[]>]))(value),
    'string',
  ) as Value<string, E>;

export { string };
