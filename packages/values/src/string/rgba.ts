import { err, ok, rule } from '@mixor/core';

import type { StringValueError } from './string';

/**
 * Result error type related to the string `rgba` rule.
 *
 * @internal
 */
type InvalidRGBA = StringValueError<'InvalidRGBAError', 'rgba'>;

/**
 * Instance of the `InvalidRGBA` error type.
 *
 * @internal
 */
const InvalidRGBA: InvalidRGBA = {
  code: 'InvalidRGBAError',
  context: 'StringValue',
  origin: 'rgba',
  message: 'Value is not a valid RGBA color',
};

// Regular expression for RGBA validation (from Zod source code).
const rgbaRegex = /^rgba?\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3}),\s*([01]|0\.\d+)\)$/;

/**
 * Value rule that validates that the value is a valid RGBA color.
 *
 * @param value - The string value to validate.
 * @returns A result indicating whether the value is a valid RGBA color.
 *
 * @public
 */
const rgba = rule((value: string) => (rgbaRegex.test(value) ? ok(value) : err(InvalidRGBA)));

export { rgba };
