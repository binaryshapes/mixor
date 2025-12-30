import tsupConfig from './src/tsup';

export default [
  // Build source files
  tsupConfig({
    entry: [
      'src/**/*.ts',
    ],
    onSuccess: 'cp -r src/typescript dist/src && cp -r src/moon dist/src',
    outDir: 'dist/src',
  }),
  // Build binaries
  tsupConfig({
    entry: {
      'bin/sync-release-please': 'bin/sync-release-please.ts',
    },
    format: ['esm'],
    outDir: 'dist',
    minify: false,
    banner: {
      js: '#!/usr/bin/env node',
    },
    dts: false,
  }),
];
