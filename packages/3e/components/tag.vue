<template>
  <div :class="['tag', `theme__${theme}`, `format__${format}`, `size__${size}`]">

    <slot v-if="!text" />

    <div v-else class="label">
      <span v-if="preText" class="pre-text">{{ preText }}</span>
      <span class="text">{{ text }}</span>
    </div>

  </div>
</template>

<script>
// ====================================================================== Export
export default {
  name: 'Button',

  props: {
    preText: {
      type: [String, Boolean],
      required: false,
      default: false
    },
    text: {
      type: [String, Boolean],
      required: false,
      default: false
    },
    theme: {
      type: String, // 'dark-gray', 'purple', 'orange', 'green-muted'
      required: false,
      default: 'dark-gray'
    },
    format: {
      type: String, // 'chiclet', 'pre'
      required: false,
      default: 'chiclet'
    },
    size: {
      type: String, // 'regular', 'mini'
      required: false,
      default: 'regular'
    }
  }
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General

.format__chiclet {
  padding: 0.25rem 0.75rem;
}

.format__pre {
  padding: 0.25rem 0.75rem;
}

.label {
  display: inline-flex;
}

.pre-text {
  text-decoration: underline;
  + .text {
    &:before {
      content: ': ';
    }
  }
}
</style>
