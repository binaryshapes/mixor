/**
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { n } from '@nuxo/core';

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

export { DEFAULT_ERROR_MODE, DEFAULT_VALUE_COERCE };
