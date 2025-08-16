import { type Result, ok, rule } from '@mixor/core';

/**
 * Creates a rule function that coerces a value to a string.
 *
 * @remarks
 * This function uses the `String` function to convert values to strings. Use with caution
 * as it can lead to unexpected behavior for complex non-primitive types like objects
 * or arrays.
 *
 * @returns A rule function that returns a Result containing the coerced string value.
 *
 * @public
 */
const coerceString = () =>
  rule(
    (value: unknown): Result<string, never> =>
      typeof value !== 'string' ? ok(String(value)) : ok(value),
  );

export { coerceString };
