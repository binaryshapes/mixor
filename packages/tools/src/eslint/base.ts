/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import nx from '@nx/eslint-plugin';
import { type ConfigArray } from 'typescript-eslint';

import { importsExportsTypes, jsonParser, tsJsDoc } from './presets';

/**
 * Base ESLint configuration based on the recommended configuration, Nx rules and Nuxo's presets.
 */
const config: ConfigArray = [
  // Ref: https://github.com/nrwl/nx/blob/master/packages/eslint-plugin/src/flat-configs/base.ts
  ...nx.configs['flat/base'],

  // Ref: https://github.com/nrwl/nx/blob/master/packages/eslint-plugin/src/flat-configs/typescript.ts
  ...nx.configs['flat/typescript'],

  // Ref: https://github.com/nrwl/nx/blob/master/packages/eslint-plugin/src/flat-configs/javascript.ts
  ...nx.configs['flat/javascript'],

  // Nuxo's presets.
  ...jsonParser,
  ...importsExportsTypes,
  ...tsJsDoc,
  {
    ignores: ['**/dist'],
  },
];

export default config;
