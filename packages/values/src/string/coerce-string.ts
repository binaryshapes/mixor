import { type Result, ok, rule } from '@mixor/core';

/**
 * Coerces a value to a string.
 * It uses the `String` function to convert the value to a string.
 *
 * @remarks
 * Use this function with caution, as it can lead to unexpected behavior for complex non-primitive
 * types like objects or arrays.
 *
 * @returns The coerced string value.
 *
 * @public
 */
const coerceString = () =>
  rule(
    (value: unknown): Result<string, never> =>
      typeof value !== 'string' ? ok(String(value)) : ok(value),
  );

export { coerceString };
