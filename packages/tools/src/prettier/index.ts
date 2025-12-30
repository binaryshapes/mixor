/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { deepmerge } from 'deepmerge-ts';
import type { Config } from 'prettier';

import { baseConfig } from './base';
import { multilineArraysPluginConfig, sortImportsPluginConfig } from './plugins';

// Supported path alias patterns.
const pathAliasRegex = /^(\^[@~#][\w-]+\/\(\.\*\)\$|\^?[.@~][^ ]*|\^\[\.\/\])/;

/**
 * A string that matches the path alias pattern.
 * The validation is done at runtime, so we use string for the type.
 */
type PathAliasPattern = string;

/**
 * Prettier supported plugins.
 */
type PrettierPlugins = Array<'sortImports' | 'multilineArrays'>;

/**
 * Prettier configuration options.
 */
type PrettierConfig<T extends PrettierPlugins> = {
  plugins: T;
} & ('sortImports' extends T[number]
  ? {
      importOrder: [PathAliasPattern, ...PathAliasPattern[]];
    }
  : {
      importOrder?: never;
    });

/**
 * Create a prettier config with the given options.
 *
 * @param config - The config to merge with the base config.
 * @returns The merged prettier config.
 */
function prettierConfig<T extends PrettierPlugins>(config?: PrettierConfig<T>): Config {
  // Avoid merging empty config.
  if (!config) {
    return baseConfig as Config;
  }

  const { plugins, importOrder } = config;

  // Validate import order.
  if (plugins.includes('sortImports') && importOrder) {
    importOrder.forEach((pattern) => {
      if (!pathAliasRegex.test(pattern)) {
        throw new Error(`[@nuxo/prettier] does not support the import order pattern: '${pattern}'`);
      }
    });
  }

  return deepmerge(
    baseConfig,
    plugins.includes('sortImports') ? sortImportsPluginConfig : {},
    plugins.includes('multilineArrays') ? multilineArraysPluginConfig : {},
    importOrder
      ? {
          importOrder: [...new Set(importOrder)],
        }
      : {},
  ) as Config;
}

export default prettierConfig;
