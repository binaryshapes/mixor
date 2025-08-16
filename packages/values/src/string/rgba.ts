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
 * Creates a rule function that checks whether a string is a valid RGBA color.
 *
 * @remarks
 * A valid RGBA color string follows the format `rgba(r, g, b, a)` where `r`, `g`, `b`
 * are numbers between 0 and 255, and `a` is the alpha channel between 0 and 1.
 *
 * @returns A rule function that returns a Result containing the value if it is a valid
 * RGBA color, or an error otherwise.
 *
 * @public
 */
const rgba = () => rule((value: string) => (rgbaRegex.test(value) ? ok(value) : err(InvalidRGBA)));

export { rgba };
