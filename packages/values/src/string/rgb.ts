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
 * Value rule that validates that the value is a valid RGB color.
 *
 * @param value - The string value to validate.
 * @returns A result indicating whether the value is a valid RGB color.
 *
 * @public
 */
const rgb = rule((value: string) => (rgbRegex.test(value) ? ok(value) : err(InvalidRGB)));

export { rgb };
