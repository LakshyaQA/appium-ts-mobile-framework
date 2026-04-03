import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      'no-empty': 'off', // Allow empty catch {} blocks for Appium teardowns
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/ban-ts-comment': 'off', // Allow @ts-nocheck
      '@typescript-eslint/no-unsafe-function-type': 'off', // Allow the Function type
      'preserve-caught-error': 'off', // Allow throwing errors without mandatory 'cause'
      'no-control-regex': 'off', // Allow ANSI control characters in strings/regex
      'no-useless-assignment': 'off', // Allow variable assignments that may not be used immediately
      'no-undef': 'off', // Handled by TypeScript
      'no-restricted-properties': [
        'warn',
        {
          object: 'it',
          property: 'only',
          message: 'Do not commit .only tests.',
        },
        {
          object: 'describe',
          property: 'only',
          message: 'Do not commit .only tests.',
        },
        {
          object: 'context',
          property: 'only',
          message: 'Do not commit .only tests.',
        },
        {
          object: 'it',
          property: 'skip',
          message: 'Do not commit .skip tests.',
        },
        {
          object: 'describe',
          property: 'skip',
          message: 'Do not commit .skip tests.',
        },
        {
          object: 'context',
          property: 'skip',
          message: 'Do not commit .skip tests.',
        },
      ],
    },
  },
  {
    ignores: [
      'node_modules/',
      'dist/',
      'build/',
      'allure-results/',
      'allure-report/',
      'allure-report-history/',
      'logs/',
      'reports/',
      '*.apk',
      '*.ipa',
    ],
  },
);
