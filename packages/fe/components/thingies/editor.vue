<template>
  <div :class="['thingie-editor', { open }]">
    <div
      v-if="open && type === 'text'"
      class="editor-toolbar">
      <div class="font-size-control">
        <button
          class="editor-button arrow"
          @click="$emit('change-font-size', 'up')">
          ˄
        </button>
        <button
          class="editor-button arrow"
          @click="$emit('change-font-size', 'down')">
          ˅
        </button>
      </div>
      <div class="font-family-control">
        <button
          class="editor-button"
          @click="$emit('change-font-family')">
          f
        </button>
      </div>
    </div>
  </div>
</template>

<script>
// ====================================================================== Export
export default {
  name: 'Editor',

  props: {
    open: {
      type: Boolean,
      required: true,
      default: false
    },
    type: {
      type: String,
      required: true,
      validator (val) {
        return ['text', 'image', 'sound', 'video'].includes(val)
      }
    }
  },

  watch: {
    open (val) {
      if (val) {
        document.onkeydown = (e) => { this.handleKeydown(e) }
      } else {
        document.onkeydown = null
      }
    }
  },

  methods: {
    handleKeydown (e) {
      e.preventDefault()
      if (e.keyCode === 38 || e.key === 'ArrowUp') {
        this.$emit('change-zindex', 'front')
      } else if (e.keyCode === 40 || e.key === 'ArrowDown') {
        this.$emit('change-zindex', 'back')
      } else if (e.keyCode === 37 || e.key === 'ArrowLeft') {
        this.$emit('rotate-thingie', 'ccw')
        this.$pressKeyAndHold(document, 500, () => {
          this.$emit('rotate-thingie', 'ccw')
        })
      } else if (e.keyCode === 39 || e.key === 'ArrowRight') {
        this.$emit('rotate-thingie', 'cw')
        this.$pressKeyAndHold(document, 500, () => {
          this.$emit('rotate-thingie', 'cw')
        })
      }
    }
  }
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.thingie-editor {
  position: absolute;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  &.open {
    top: -1rem;
    left: -1rem;
    width: calc(100% + 2rem);
    height: calc(100% + 2rem);
    @include focusBoxShadowSmall;
    border-radius: 0.25rem;
  }
}

.font-size-control {
  display: flex;
  flex-direction: column;
}

.font-family-control {
  .editor-button {
    @include fontSize_Main;
  }
}

.editor-button {
  padding: 0.25rem;
  color: $salt;
  @include link;
  @include fontSize_Bigger;
  @include linkHover($salt);
}

.editor-toolbar {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0.5rem 0;
  height: 100%;
  position: absolute;
  left: calc(100% + 0.75rem);
}

.arrow {
  line-height: 0.5;
}
</style>
