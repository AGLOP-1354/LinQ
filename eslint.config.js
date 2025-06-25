const js = require('@eslint/js');
const typescript = require('@typescript-eslint/eslint-plugin');
const typescriptParser = require('@typescript-eslint/parser');
const react = require('eslint-plugin-react');
const reactHooks = require('eslint-plugin-react-hooks');
const prettier = require('eslint-plugin-prettier');
const prettierConfig = require('eslint-config-prettier');

module.exports = [
  // 기본 JavaScript 권장 설정
  js.configs.recommended,

  // Prettier 설정 (충돌 방지)
  prettierConfig,

  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        __DEV__: 'readonly',
        fetch: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        require: 'readonly',
        module: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      react: react,
      'react-hooks': reactHooks,
      prettier: prettier,
    },
    rules: {
      // Prettier 규칙
      'prettier/prettier': 'error',

      // React 규칙
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/display-name': 'off',
      'react/jsx-key': 'error',
      'react/jsx-no-duplicate-props': 'error',
      'react/jsx-no-undef': 'error',
      'react/jsx-uses-react': 'off',
      'react/jsx-uses-vars': 'error',

      // React Hooks 규칙
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // TypeScript 규칙 - 사용하지 않는 변수/import 엄격하게 관리
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: true,
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',

      // 일반 규칙 - 사용하지 않는 변수/import 관리
      'no-unused-vars': 'off', // TypeScript 규칙 사용
      'no-undef': 'off', // TypeScript에서 처리
      'no-unused-expressions': 'error',
      'no-unreachable': 'error',
      'no-unused-labels': 'error',

      // Import/Export 관련 규칙
      'no-duplicate-imports': 'error',

      // 기타 코드 품질 규칙
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'no-empty': 'error',
      'no-empty-function': 'warn',
      'no-useless-return': 'error',
      'no-useless-catch': 'error',
      'no-useless-concat': 'error',
      'no-useless-escape': 'error',
      'no-useless-rename': 'error',

      // 변수 선언 관련
      'prefer-destructuring': [
        'warn',
        {
          array: true,
          object: true,
        },
        {
          enforceForRenamedProperties: false,
        },
      ],
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },

  // 무시할 파일들
  {
    ignores: [
      'node_modules/',
      'dist/',
      'build/',
      '.expo/',
      'web-build/',
      'android/',
      'ios/',
      '*.config.js',
      'metro.config.js',
      'babel.config.js',
      '*.log',
      '.env*',
      '.DS_Store',
      'coverage/',
    ],
  },
];
