import prettierConfig from '@nuxo/tools/prettier';

export default prettierConfig({
  plugins: ['sortImports', 'multilineArrays'],
  importOrder: ['^[./]'],
});
