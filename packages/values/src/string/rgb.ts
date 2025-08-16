import { err, ok, rule } from '@mixor/core';

import type { StringValueError } from './string';

/**
 * Result error type related to the string `rgb` rule.
 *
 * @internal
 */
type InvalidRGB = StringValueError<'InvalidRGBError', 'rgb'>;

/**
 * Instance of the `InvalidRGB` error type.
 *
 * @internal
 */
const InvalidRGB: InvalidRGB = {
  code: 'InvalidRGBError',
  context: 'StringValue',
  origin: 'rgb',
  message: 'Value is not a valid RGB color',
};

// Regular expression for RGB validation (from Zod source code).
const rgbRegex = /^rgb?\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/;

/**
 * Creates a value rule function that validates string values are valid RGB colors.
 *
 * @remarks
 * An RGB color is a string that represents a color in the format `rgb(r, g, b)`,
 * where `r`, `g`, and `b` are the red, green, and blue components of the color.
 *
 * @returns A rule function that validates that the value is a valid RGB color.
 * This function returns a Result type with the value if it is a valid RGB color, or an
 * error if it is not.
 *
 * @public
 */
const rgb = () => rule((value: string) => (rgbRegex.test(value) ? ok(value) : err(InvalidRGB)));

export { rgb };
