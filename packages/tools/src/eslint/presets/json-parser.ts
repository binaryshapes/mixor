/*
 * This file is part of the UnoKit project.
 *
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import eslint from 'eslint/config';
import jsonParser from 'jsonc-eslint-parser';

/**
 * Json parser preset.
 * @see https://github.com/ota-meshi/jsonc-eslint-parser
 */
export default eslint.defineConfig({
  files: ['*.json', '*.json5'],
  languageOptions: {
    parser: jsonParser,
  },
});
