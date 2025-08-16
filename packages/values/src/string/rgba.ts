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
 * Creates a value rule function that validates string values are valid RGBA colors.
 *
 * @remarks
 * An RGBA color is a string that represents a color in the format `rgba(r, g, b, a)`,
 * where `r`, `g`, `b` are the red, green, and blue components of the color, and `a` is the
 * alpha channel.
 *
 * @returns A rule function that validates that the value is a valid RGBA color.
 * This function returns a Result type with the value if it is a valid RGBA color, or an
 * error if it is not.
 *
 * @public
 */
const rgba = () => rule((value: string) => (rgbaRegex.test(value) ? ok(value) : err(InvalidRGBA)));

export { rgba };
