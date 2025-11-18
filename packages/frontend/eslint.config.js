// frontend/eslint.config.js
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import { defineConfig } from 'eslint-define-config';
import importPlugin from 'eslint-plugin-import';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

const fsdLayers = [
  { name: 'app', path: './src/app' },
  { name: 'pages', path: './src/pages' },
  { name: 'widgets', path: './src/widgets' },
  { name: 'features', path: './src/features' },
  { name: 'entities', path: './src/entities' },
  { name: 'shared', path: './src/shared' },
];

const fsdRestrictedZones = fsdLayers
  .map((layer, index) => {
    const disallowedTargets = fsdLayers.slice(0, index).map((entry) => entry.path);
    if (disallowedTargets.length === 0 || layer.name === 'shared') {
      return null;
    }
    const allowedNames = fsdLayers.slice(index).map((entry) => entry.name).join(', ');
    return {
      target: layer.path,
      from: disallowedTargets,
      message: `Layer "${layer.name}" can only import from ${allowedNames}.`,
    };
  })
  .filter(Boolean);

export default defineConfig({
  plugins: {
    '@typescript-eslint': tsPlugin,
    react: reactPlugin,
    'react-hooks': reactHooksPlugin,
    import: importPlugin,
  },
  languageOptions: {
    parser: tsParser,
    parserOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      ecmaFeatures: {
        jsx: true,
      },

    },
  },
  settings: {
    react: {
      version: 'detect',
    },
    'import/resolver': {
      typescript: {
        project: './tsconfig.json',
      },
    },
  },
  rules: {
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'object'],
        pathGroups: [
          { pattern: '@/**', group: 'internal', position: 'before' },
        ],
        alphabetize: { order: 'asc', caseInsensitive: true },
        'newlines-between': 'always',
      },
    ],
    'import/newline-after-import': ['error', { count: 1 }],
    'import/no-unresolved': 'error',
    'import/no-restricted-paths': ['error', { zones: fsdRestrictedZones }],
    'import/no-useless-path-segments': 'error',
  },
  ignores: ['node_modules', 'dist'],
});
