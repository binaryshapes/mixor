import prettierConfig from '@unokit/prettier';

export default prettierConfig({
  plugins: ['sortImports', 'multilineArrays'],
  importOrder: ['^@mixor/(.*)$', '^[./]'],
});
