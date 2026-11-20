import parser from '@typescript-eslint/parser';
export default [
  { ignores: ['dist/**', 'node_modules/**', '.expo/**', '.qa/**', 'assets/**'] },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser,
      parserOptions: { ecmaFeatures: { jsx: true }, ecmaVersion: 'latest', sourceType: 'module' },
    },
    rules: {
      'no-unreachable': 'error',
      'no-dupe-else-if': 'error',
      'no-unsafe-finally': 'error',
      'no-debugger': 'error',
      'no-duplicate-imports': 'error',
      'no-constant-condition': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
];
