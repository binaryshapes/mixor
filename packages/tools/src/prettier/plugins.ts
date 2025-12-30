/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { type Config } from 'prettier';

/**
 * Sort imports using prettier-plugin-sort-imports.
 *
 * @remarks
 * This plugin is included in the base configuration because it is a good plugin to have.
 *
 * @see
 * https://github.com/trivago/prettier-plugin-sort-imports
 */
const sortImportsPluginConfig: Config = {
  // TODO: migrate to https://github.com/ianvs/prettier-plugin-sort-imports
  plugins: ['@trivago/prettier-plugin-sort-imports'],
  // By default, the import order is empty.
  importOrder: [],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  // To avoid the error: SyntaxError: This experimental syntax requires enabling one of the
  // following parser plugin(s): "decorators", "decorators-legacy".
  // Ref: https://github.com/trivago/prettier-plugin-sort-imports/issues/120#issuecomment-1873414061
  importOrderParserPlugins: [
    'typescript',
    'jsx',
    'classProperties',
    // To avoid the error: "SyntaxError: Decorators cannot be used to decorate parameters".
    'decorators-legacy',
  ],
};

/**
 * Sort multiline arrays using prettier-plugin-multiline-arrays.
 *
 * @remarks
 * This plugin is included in the base configuration because it is a good plugin to have.
 *
 * @see
 * https://github.com/electrovir/prettier-plugin-multiline-arrays
 */
const multilineArraysPluginConfig: Config = {
  plugins: ['prettier-plugin-multiline-arrays'],
};

export { multilineArraysPluginConfig, sortImportsPluginConfig };
