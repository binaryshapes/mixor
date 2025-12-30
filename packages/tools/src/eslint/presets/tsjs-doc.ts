import jsdoc from 'eslint-plugin-jsdoc';
import tsdoc from 'eslint-plugin-tsdoc';
import eslint from 'eslint/config';

/**
 * ESLint configuration for TypeScript and JavaScript documentation.
 */
export default eslint.defineConfig({
  plugins: {
    tsdoc,
    jsdoc,
  },
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
    // Recommended rules.
    'tsdoc/syntax': 'warn',
    'jsdoc/check-param-names': 'warn',
    'jsdoc/check-alignment': 'warn',
    'jsdoc/check-indentation': 'warn',
    'jsdoc/check-line-alignment': 'warn',
    'jsdoc/check-template-names': 'warn',
    'jsdoc/check-property-names': 'warn',
    'jsdoc/check-syntax': 'warn',
    'jsdoc/check-types': 'warn',
    'jsdoc/check-values': 'warn',
    'jsdoc/require-param-name': 'warn',
    'jsdoc/require-property': 'warn',
    'jsdoc/require-property-description': 'warn',
    'jsdoc/require-property-name': 'warn',
    'jsdoc/require-property-type': 'warn',

    // Disable for now (Eslint 8+ not supported).
    'jsdoc/check-examples': 'off',

    // Personal preference.
    'jsdoc/tag-lines': 'off',

    // Just because @typeParam is not part of jsdoc.
    'jsdoc/check-tag-names': 'off',
  },
  extends: [
    jsdoc.configs['flat/recommended-typescript'],
  ],
});
