import { ok, rule, value } from '@mixor/core';

/**
 * Creates a boolean value with automatic type inference.
 *
 * @returns A new boolean value.
 *
 * @public
 */
const boolean = () => value(rule((value: boolean) => ok(Boolean(value)))).subType('boolean');

export { boolean };
