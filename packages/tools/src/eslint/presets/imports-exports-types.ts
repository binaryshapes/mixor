/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import eslint from 'eslint/config';

/**
 * Forcing consistent type imports and exports.
 */
export default eslint.defineConfig({
  files: [
    '**/*.ts',
    '**/*.tsx',
  ],
  ignores: [
    '**/*.mdx/**.ts',
    '**/*.mdx/**.tsx',
  ],
  languageOptions: {
    parserOptions: {
      projectService: true,
      emitDecoratorMetadata: true,
      experimentalDecorators: true,
    },
  },
  rules: {
    '@typescript-eslint/consistent-type-imports': 'error',
    '@typescript-eslint/consistent-type-exports': 'error',
  },
});
