/*
 * This file is part of the Nuxo project.
 * Copyright (c) 2025, Binary Shapes.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { type Options, defineConfig } from 'tsup';

const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf-8'));

// Default configuration for Tsup.
const config: Options = {
  splitting: false,
  sourcemap: false,
  clean: true,
  format: ['esm', 'cjs'],
  outExtension: ({ format }) => ({ js: format === 'cjs' ? '.cjs' : '.mjs' }),
  tsconfig: 'tsconfig.json',
  shims: true,
  treeshake: true,
  outDir: 'dist',
  minify: true,
  minifyIdentifiers: true,
  minifySyntax: true,
  minifyWhitespace: true,
  silent: true,
  // Dependencies and devDependencies as external dependencies.
  external: [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ],
  entry: ['src/index.ts'],

  // This avoid the TS6307 error on composite tsconfig.json.
  // See more: https://github.com/egoist/tsup/issues/571#issuecomment-2457920686
  dts: {
    compilerOptions: {
      composite: false,
      declaration: false,
    },
  },
};

/**
 * Configuration to build a project using the Tsup library and supports both ESM and CJS formats.
 *
 * It is possible to extend this configuration by using the tsup native options.
 *
 * Is recommended to provide the `entry` and `external` options to avoid conflicts. By default,
 * the `entry` option is `['src/index.ts']` and the `external` option includes the dependencies
 * and devDependencies from the `package.json` file.
 *
 * @param options - The options to extend the configuration.
 * @returns The Tsup configuration.
 */
const tsupConfig = (options: Options) => defineConfig({ ...config, ...options });

export default tsupConfig;
