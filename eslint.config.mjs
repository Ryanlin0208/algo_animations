/**
 * @fileoverview ESLint flat config following the Google JavaScript Style
 * Guide (https://google.github.io/styleguide/jsguide.html). Formatting
 * (indentation, quotes, wrapping) is left to Prettier; see .prettierrc.json.
 * Self-contained so it runs without installing plugins in this repository.
 */

const browserGlobals = {
  clearInterval: 'readonly',
  clearTimeout: 'readonly',
  console: 'readonly',
  document: 'readonly',
  Event: 'readonly',
  globalThis: 'readonly',
  history: 'readonly',
  location: 'readonly',
  requestAnimationFrame: 'readonly',
  setInterval: 'readonly',
  setTimeout: 'readonly',
  URL: 'readonly',
  window: 'readonly',
};

const nodeGlobals = {
  console: 'readonly',
  module: 'writable',
  require: 'readonly',
};

const googleRules = {
  'camelcase': ['error', {properties: 'never'}],
  'curly': ['error', 'multi-line'],
  'eqeqeq': ['error', 'always', {null: 'ignore'}],
  'max-len': [
    'error',
    {
      code: 80,
      ignoreRegExpLiterals: true,
      ignoreStrings: true,
      ignoreTemplateLiterals: true,
      ignoreUrls: true,
    },
  ],
  'new-cap': 'error',
  'no-new-object': 'error',
  'no-var': 'error',
  'one-var': ['error', 'never'],
  'prefer-const': ['error', {destructuring: 'all'}],
  'prefer-rest-params': 'error',
  'prefer-spread': 'error',
};

export default [
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {...browserGlobals, module: 'readonly'},
      sourceType: 'script',
    },
    rules: googleRules,
  },
  {
    files: ['**/*.cjs'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: nodeGlobals,
      sourceType: 'commonjs',
    },
    rules: googleRules,
  },
];
