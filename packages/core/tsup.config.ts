import tsupConfig from '@unokit/tsup';
import { defineConfig } from 'tsup';

export default defineConfig({
  ...tsupConfig,
  entry: ['src/index.ts'],
});
