'use strict'

const neo = require('neostandard')

module.exports = [
  ...neo({
    ignores: require('neostandard').resolveIgnoresFromGitignore(),
    languageOptions: {
      globals: ['commonjs', 'es2021', 'node']
    }
  }),
  {
    rules: {
      'no-lonely-if': 'off',
      'no-new': 'off',
      'no-prototype-builtins': 'off',
      'multiline-ternary': 'off',
      'prefer-regex-literals': 'off',
      '@stylistic/comma-dangle': ['error', 'never']
    }
  }
]
