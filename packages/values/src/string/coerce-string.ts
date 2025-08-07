import { type Result, ok, rule } from '@mixor/core';

/**
 * Coerces a value to a string.
 * It uses the `String` function to convert the value to a string.
 *
 * @param value - The value to coerce.
 * @returns The coerced string value.
 *
 * @example
 * ```ts
 * // coerce-string-001: Coerce string value.
 * const result = coerceString('hello');
 * // result: ok('hello').
 * ```
 *
 * @example
 * ```ts
 * // coerce-string-002: Coerce number to string.
 * const result = coerceString(123);
 * // result: ok('123').
 * ```
 *
 * @public
 */
const coerceString = rule(
  (value: unknown): Result<string, never> =>
    typeof value !== 'string' ? ok(String(value)) : ok(value),
);

export { coerceString };
