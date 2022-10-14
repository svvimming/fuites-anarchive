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
.tag {
  font-weight: 500;
  white-space: nowrap;
  &.theme__dark-gray {
    background-color: black;
  }
  &.theme__purple {
    background-color: black;
  }
  &.theme__orange {
    background-color: black;
    color: black;
  }
  &.theme__green-muted {
    background-color: black;
  }
  &.size__regular {
    font-size: 0.9375rem;
  }
  &.size__mini {
    font-size: 0.75rem;
  }
}

.format__chiclet {
  padding: 0.25rem 0.75rem;
  border-radius: 1.5rem;
}

.format__pre {
  padding: 0.25rem 0.75rem;
  border-radius: 0.25rem;
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
