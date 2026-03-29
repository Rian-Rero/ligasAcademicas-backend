import globals from 'globals';
import pluginJs from '@eslint/js';
import prettier from 'eslint-plugin-prettier';

export default [
  { files: ['**/*.{js,mjs,cjs,jsx}'] },
  {
    languageOptions: {
      globals: globals.node,
    },
  },
  pluginJs.configs.recommended,
  {
    plugins: {
      prettier,
    },
    rules: {
      'no-underscore-dangle': 0,
      'func-names': ['error', 'never'],
      'no-unused-vars': 2,
    },
  },
];
