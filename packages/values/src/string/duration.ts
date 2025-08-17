import { err, ok, rule } from '@mixor/core';

import type { StringValueError } from './string';

/**
 * Result error type related to the string `duration` rule.
 *
 * @internal
 */
type InvalidDuration = StringValueError<'InvalidDurationError', 'duration'>;

/**
 * Instance of the `InvalidDuration` error type.
 *
 * @internal
 */
const InvalidDuration: InvalidDuration = {
  code: 'InvalidDurationError',
  context: 'StringValue',
  origin: 'duration',
  message: 'Value is not a valid ISO 8601 duration',
};

/**
 * ISO 8601-1 duration regex. Does not support the 8601-2 extensions like negative durations
 * or fractional/negative components.
 *
 * @internal
 */
const durationRegex =
  /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/;

/**
 * Implements ISO 8601-2 extensions like explicit +- prefixes, mixing weeks with other units,
 * and fractional/negative components.
 *
 * @internal
 */
const extendedDurationRegex =
  /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;

/**
 * Creates a rule function that checks whether a string is a valid ISO 8601 duration.
 *
 * @remarks
 * A valid ISO 8601 duration follows the format PnYnMnDTnHnMnS where:
 * - P is the duration designator (period)
 * - Y, M, W, D are date components (years, months, weeks, days)
 * - T is the time designator
 * - H, M, S are time components (hours, minutes, seconds)
 *
 * The extended version supports negative durations, fractional components, and mixing weeks
 * with other units.
 *
 * @param extended - Whether to use the extended ISO 8601-2 format (default: false).
 * @returns A rule function that returns a Result containing the value if it is a valid
 * duration, or an error otherwise.
 *
 * @public
 */
const duration = (extended = false) =>
  rule((value: string) => {
    const pattern = extended ? extendedDurationRegex : durationRegex;
    return pattern.test(value) ? ok(value) : err(InvalidDuration);
  });

export { duration };
