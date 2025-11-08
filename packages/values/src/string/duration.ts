/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { rule } from '@nuxo/components';
import { n } from '@nuxo/core';

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
 * Creates a rule that checks if the string is a valid ISO 8601 duration.
 *
 * @remarks
 * A valid ISO 8601 duration follows the format PnYnMnDTnHnMnS where:
 * - P is the duration designator (period)
 * - Y, M, W, D are date components (years, months, weeks, days)
 * - T is the time designator
 * - H, M, S are time components (hours, minutes, seconds)
 *
 * The extended version supports negative durations, fractional components, and mixing weeks
 * with other units. If the string is not a valid duration, the rule will return an error
 * Result with code 'INVALID_DURATION'.
 *
 * @param extended - Whether to use the extended ISO 8601-2 format (default: false).
 * @returns A rule function that validates if the string is a valid duration.
 *
 * @public
 */
const Duration = rule((extended: boolean = false) => {
  const pattern = extended ? extendedDurationRegex : durationRegex;
  return n.assert((value: string) => pattern.test(value), 'INVALID_DURATION');
});

n.info(Duration)
  .type('string')
  .params(['extended', 'boolean'])
  .doc({
    title: 'Duration',
    body: n.doc`
    A rule that checks if the string is a valid ISO 8601 duration. A valid ISO 8601 duration
    follows the format PnYnMnDTnHnMnS. The extended version supports negative durations,
    fractional components, and mixing weeks with other units. If the string is not a valid
    duration, the rule will return a failure Result with code 'INVALID_DURATION'.
    `,
  });

export { Duration };
