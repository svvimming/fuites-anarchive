<template>
  <div
    ref="editorContainer"
    :class="['thingie-editor', { open }, { colorpicker }]"
    :style="editorStyles"
    @click.self="closeColorEditor"
    @mousemove.capture="handleMouseMove($event)">

    <div
      v-if="open && type === 'text'"
      class="editor-toolbar">

      <div class="font-size-control">
        <button
          type="button"
          class="editor-button arrow"
          @click="$emit('change-font-size', 'up')">
          ˄
        </button>
        <button
          type="button"
          class="editor-button arrow"
          @click="$emit('change-font-size', 'down')">
          ˅
        </button>
      </div>

      <div class="font-family-control">
        <button
          type="button"
          class="editor-button"
          @click="$emit('change-font-family')">
          f
        </button>
      </div>

      <div
        v-if="editColor"
        :class="['color-control', { active: colorpicker }]">
        <button
          type="button"
          class="editor-button"
          @click="openColorEditor">
          c
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
    },
    editColor: {
      type: Boolean,
      required: false,
      default: true
    },
    highlightColor: {
      type: String,
      required: false,
      default: '#cbc0d9'
    }
  },

  data () {
    return {
      width: 320,
      height: 128,
      color: '',
      colorpicker: false
    }
  },

  computed: {
    editorStyles () {
      return {
        '--color-control': this.color,
        '--highlight-color': this.highlightColor
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
        this.$emit('rotate-thingie', 1)
        this.$pressKeyAndHold(document, 500, () => {
          this.$emit('rotate-thingie', 2)
        })
      } else if (e.keyCode === 39 || e.key === 'ArrowRight') {
        this.$emit('rotate-thingie', -1)
        this.$pressKeyAndHold(document, 500, () => {
          this.$emit('rotate-thingie', -2)
        })
      }
    },
    openColorEditor () {
      this.colorpicker = !this.colorpicker
    },
    closeColorEditor () {
      if (this.colorpicker) {
        this.colorpicker = false
      }
    },
    handleMouseMove (evt) {
      if (this.colorpicker) {
        const editor = this.$refs.editorContainer
        const editorRect = editor.getBoundingClientRect()
        const mouseX = evt.clientX - editorRect.left
        const mouseY = evt.clientY - editorRect.top
        const h = Math.floor((mouseX / this.width) * 360)
        const g = Math.floor((mouseY / this.height) * 100)
        const l = Math.max(g - 11, 0)
        const rgb = this.$convertHSLtoRGB(h, g, l)
        this.color = this.$convertRGBtoHex(rgb[0], rgb[1], rgb[2])
        this.$emit('change-color', this.color)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.thingie-editor {
  --color-control: #000000;
  --highlight-color: #cbc0d9;
  position: absolute;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  &.open {
    top: -1rem;
    left: -1rem;
    width: calc(100% + 2rem);
    height: calc(100% + 2rem);
    // @include focusBoxShadowSmall;
    border-radius: 0.25rem;
    &:before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      opacity: 0.5;
      border-radius: inherit;
      box-shadow: 0 0 3px 3px var(--highlight-color);
    }
    &.colorpicker {
      z-index: 2;
      cursor: pointer;
      .color-control {
        .editor-button {
          color: var(--color-control);
        }
      }
    }
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

.color-control {
  &.active {
    .editor-button {
      @include fontWeight_Bold;
      transform: scale(1.25);
    }
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
