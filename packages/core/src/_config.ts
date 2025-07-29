/*
 * This file is part of the Mixor project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Core global configuration.
 *
 * @public
 */
const config = {
  /**
   * Whether to show the trace metadata (default: true).
   */
  showTraceMeta:
    process.env.MIXOR_SHOW_TRACE_META === 'true' || process.env.MIXOR_SHOW_TRACE_META === 'false'
      ? Boolean(process.env.MIXOR_SHOW_TRACE_META)
      : true,

  /**
   * Whether to show the trace function values (default: true).
   */
  showTraceFunctionValues:
    process.env.MIXOR_SHOW_TRACE_FUNCTION_VALUES === 'true' ||
    process.env.MIXOR_SHOW_TRACE_FUNCTION_VALUES === 'false'
      ? Boolean(process.env.MIXOR_SHOW_TRACE_FUNCTION_VALUES)
      : true,
};

export { config };
