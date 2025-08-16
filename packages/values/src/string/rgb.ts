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
 * Creates a rule function that checks whether a string is a valid RGB color.
 *
 * @remarks
 * A valid RGB color string follows the format `rgb(r, g, b)` where `r`, `g`, and `b`
 * are numbers between 0 and 255.
 *
 * @returns A rule function that returns a Result containing the value if it is a valid
 * RGB color, or an error otherwise.
 *
 * @public
 */
const rgb = () => rule((value: string) => (rgbRegex.test(value) ? ok(value) : err(InvalidRGB)));

export { rgb };
