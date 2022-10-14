<template>
  <component
    :is="tag"
    :to="tag === 'nuxt-link' ? to : false"
    :href="to"
    :class="['button', `type__${type}`, `format__${format}`, { selected }]"
    :disabled="disabled"
    :target="target"
    @click="clickHandler($event)">

    <LoaderTripleDot :class="{ show: loading }" />

    <div :class="['button-content', { hide: loading }]">
      <template v-if="text">
        {{ text }}
      </template>
      <slot />
    </div>

  </component>
</template>

<script>
// ===================================================================== Imports
import { mapGetters, mapActions } from 'vuex'

import LoaderTripleDot from '@/components/spinners/triple-dot'

// ====================================================================== Export
export default {
  name: 'Button',

  components: {
    LoaderTripleDot
  },

  props: {
    type: { // 'A', 'B', 'C', 'D', 'X' (unstyled)
      type: String,
      required: false,
      default: 'X'
    },
    format: { // 'mini', 'regular'
      type: String,
      required: false,
      default: 'regular'
    },
    tag: { // button, 'a' or nuxt-link
      type: String,
      required: false,
      default: 'button'
    },
    to: {
      type: [String, Boolean],
      required: false,
      default: false
    },
    target: {
      type: [String, Boolean],
      required: false,
      default: false
    },
    loader: {
      type: [String, Boolean],
      required: false,
      default: false
    },
    text: {
      type: [String, Boolean],
      required: false,
      default: false
    },
    disabled: {
      type: Boolean,
      required: false,
      default: false
    },
    selected: {
      type: Boolean,
      required: false,
      default: false
    }
  },

  data () {
    return {
      timeout: false
    }
  },

  computed: {
    ...mapGetters({
      loaders: 'general/loaders'
    }),
    loading () {
      return this.loaders.find(obj => obj === this.loader)
    }
  },

  methods: {
    ...mapActions({
      addLoader: 'general/addLoader',
      removeLoader: 'general/removeLoader'
    }),
    clickHandler (e) {
      e.stopPropagation()
      if (!this.disabled) {
        clearTimeout(this.timeout)
        const loader = this.loader
        if (typeof loader === 'string') {
          this.addLoader(loader)
          this.timeout = setTimeout(() => {
            this.removeLoader(loader)
            clearTimeout(this.timeout)
          }, 4000)
        }
        this.$emit('clicked', e)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.button {
  position: relative;
  cursor: pointer;
}

.triple-dot-loader,
.button-content {
  width: 100%;
  height: 100%;
}

.triple-dot-loader {
  position: absolute;
  top: 0;
  left: 0;
  opacity: 0;
  &.show {
    opacity: 1;
  }
}

.button-content {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  &.hide {
    opacity: 0;
  }
}

// /////////////////////////////////////////////////////////////// [Type] Common
.button {
  white-space: nowrap;
  padding: 0.25rem 1rem;
  border-radius: 1.5rem;
  &:not([disabled]) {
    &:focus-visible {
      @include focusBoxShadow;
    }
  }
  &[disabled] {
    box-shadow: none;
    cursor: no-drop;
  }
}

.button-content {
  font-weight: 500;
}

// ///////////////////////////////////////////////////////////////////// Formats
.format__mini {
  font-size: 0.75rem;
  padding: 0.25rem 0.75rem;
}

// //////////////////////////////////////////////////////////////////// [Type] A
.type__A {
  border: 2px solid black;
  border-radius: 2rem;
  &:not([disabled]) {
    &:hover,
    &.selected {
      background-color: black;
    }
  }
  &[disabled] {
    opacity: 0.5;
  }
}

// //////////////////////////////////////////////////////////////////// [Type] B
.type__B {
  border: 1px solid white;
  border-radius: 2rem;
  &:not([disabled]) {
    &:hover {
      background-color: white;
      color: black;
    }
  }
  &.format__mini {
    padding: 0.125rem 0.5rem;
  }
  &.selected {
    background-color: white;
    color: black;
  }
}

// //////////////////////////////////////////////////////////////////// [Type] C
.type__C {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  position: relative;
  padding: 0.5rem 1rem;
  font-size: 0.75rem;
  color: black;
  white-space: nowrap;
  opacity: 0.5;
  border-radius: 0;
  &:before {
    content: '';
    position: absolute;
    top: 0;
    right: calc(100% - 1px);
    width: 1px;
    height: 100%;
    transition: 250ms ease-out;
  }
  &:not([disabled]) {
    &:hover {
      color: white;
      padding-right: calc(1rem + 0.5rem);
      &:before {
        transform: scaleX(8) translateX(-50%);
      }
    }
  }
  &[disabled] {
    opacity: 0.5;
  }
}

// //////////////////////////////////////////////////////////////////// [Type] D
.type__D {
  padding: 0;
  font-size: 1.125rem;
  color: black;
  border-radius: 0.5rem;
  transition: 150ms ease-out;
  &:after {
    content: '';
    position: absolute;
    top: calc(100% + 0.25rem);
    left: 0;
    width: 100%;
    height: 0px;
    background-color: black;
    transition: 150ms ease-out;
  }
  &:not([disabled]) {
    &:hover {
      &:after {
        transition: 150ms ease-in;
        height: 0.25rem;
      }
    }
    &.selected {
      transition: 150ms ease-in;
      color: white;
      &:after {
        transition: 150ms ease-in;
        height: 0.25rem;
        background-color: white;
      }
    }
  }
  &:disabled {
    opacity: 0.5;
  }
}
</style>
