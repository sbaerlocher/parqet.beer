import js from '@eslint/js';
import ts from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import security from 'eslint-plugin-security';
import globals from 'globals';

export default ts.config(
  js.configs.recommended,
  ...ts.configs.recommended,
  ...svelte.configs['flat/recommended'],
  security.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  {
    files: ['**/*.svelte'],
    languageOptions: { parserOptions: { parser: ts.parser } },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'security/detect-object-injection': 'off',
      // Asset pipeline reads/writes file paths built from a static list.
      'security/detect-non-literal-fs-filename': 'off',
      // Rule requires Svelte 5.25+ resolve() helper; plain string hrefs are
      // fine for SvelteKit 2.x. Revisit once the helper is universally adopted.
      'svelte/no-navigation-without-resolve': 'off',
      // Local (non-reactive) Set/URLSearchParams usage is legitimate; this
      // rule flags even temporary values. Keep on for reactive state only.
      'svelte/prefer-svelte-reactivity': 'off',
    },
  },
  {
    ignores: ['.svelte-kit/', 'build/', 'dist/', 'node_modules/', 'coverage/'],
  }
);
