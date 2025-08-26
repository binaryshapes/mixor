/**
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { ErrorMode } from './result';

/**
 * Core internal configuration.
 *
 * @public
 */
const Config = {
  /**
   * Default error mode for values and schemas.
   *
   * @remarks
   * - `all`: The schema will return all errors (default).
   * - `strict`: The schema will return the first error.
   *
   * @see {@link ErrorMode}
   */
  defaultErrorMode: 'all' as ErrorMode,
};

export default Config;
