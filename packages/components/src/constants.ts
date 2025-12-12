/**
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { n } from '@nuxo/core';

// TODO: This should be treated as a configuration module instead of a constants module and be able
// to be overridden by the user in runtime or via environment variables.

/**
 * The default error mode for all components that handle {@link n.Result} errors.
 *
 * @public
 */
const DEFAULT_ERROR_MODE = ('strict' as const) satisfies n.ErrorMode;

/**
 * The default value for the coerced option.
 *
 * @public
 */
const DEFAULT_VALUE_COERCE = true;

/**
 * The standard schema error mode.
 *
 * @remarks
 * This is the default error mode for the standard schema validation.
 *
 * @public
 */
const STANDARD_SCHEMA_ERROR_MODE =
  (Deno.env.get('STANDARD_SCHEMA_ERROR_MODE') ?? 'all' as const) as n.ErrorMode;

export { DEFAULT_ERROR_MODE, DEFAULT_VALUE_COERCE, STANDARD_SCHEMA_ERROR_MODE };
