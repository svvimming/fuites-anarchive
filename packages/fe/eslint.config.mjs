import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  {
    rules: {
      'no-console': process.env.NODE_ENV !== 'development' ? 'error' : 'off',
      'vue/html-closing-bracket-newline': ['error', {
        singleline: 'never',
        multiline: 'never'
      }],
      'vue/multiline-html-element-content-newline': 'off',
      'vue/singleline-html-element-content-newline': ['error', {
        ignoreWhenNoAttributes: true,
        ignores: ['th', 'td', 'span', 'label', 'pre', 'code']
      }],
      'no-trailing-spaces': ['error', {
        skipBlankLines: true
      }],
      'vue/html-self-closing': 'off',
      'vue/no-v-html': 'off',
      'no-lonely-if': 'off',
      'no-new': 'off',
      'no-prototype-builtins': 'off',
      'promise/param-names': 'off',
      'multiline-ternary': 'off',
      'vue/multi-word-component-names': 'off',
      "vue/max-attributes-per-line": ["error", {
        "singleline": {
          "max": 3
        }
      }],
      'vue/script-setup-uses-vars': 'error',
      'vue/no-v-for-template-key': 'off',
      'vue/no-v-for-template-key-on-child': 'error'
    }
  }
)
