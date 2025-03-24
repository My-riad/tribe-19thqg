module.exports = {
  root: true,
  env: {
    node: true,
    jest: true,
    es2021: true
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    project: './tsconfig.json',
    tsconfigRootDir: '.'
  },
  plugins: [
    '@typescript-eslint',
    'prettier'
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'prettier'
  ],
  rules: {
    // TypeScript specific rules
    '@typescript-eslint/explicit-module-boundary-types': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
    '@typescript-eslint/naming-convention': [
      'error',
      { 'selector': 'interface', 'format': ['PascalCase'], 'prefix': ['I'] },
      { 'selector': 'typeAlias', 'format': ['PascalCase'] },
      { 'selector': 'enum', 'format': ['PascalCase'] },
      { 'selector': 'class', 'format': ['PascalCase'] },
      { 'selector': 'classProperty', 'modifiers': ['private'], 'format': ['camelCase'], 'leadingUnderscore': 'require' },
      { 'selector': 'variable', 'format': ['camelCase', 'UPPER_CASE'] },
      { 'selector': 'function', 'format': ['camelCase'] }
    ],

    // General JavaScript rules
    'no-console': ['warn', { 'allow': ['warn', 'error', 'info'] }],
    'no-debugger': 'error',
    'no-duplicate-imports': 'error',
    'no-unused-expressions': 'error',
    'prefer-const': 'error',
    'eqeqeq': ['error', 'always'],
    'curly': 'error',

    // Prettier integration
    'prettier/prettier': 'error'
  },
  overrides: [
    {
      // Test file specific rules
      files: ['*.test.ts', '*.spec.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off'
      }
    },
    {
      // JavaScript scripts specific rules
      files: ['scripts/**/*.js'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off'
      }
    }
  ],
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    'coverage/',
    '*.js.map',
    '*.d.ts'
  ]
};