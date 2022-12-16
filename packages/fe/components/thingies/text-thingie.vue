<template>
  <div class="text-thingie">

    <div
      ref="editorContainer"
      :class="['thingie-editor', { editor }, { colorpicker }]"
      :style="editorStyles"
      @click.self="closeColorEditor"
      @mousemove.capture="handleMouseMove($event)">
      <div
        v-if="editor"
        class="editor-toolbar">

        <button
          type="button"
          :class="['editor-button', 'arrow']"
          @click="$emit('change-font-size', 'up')">
          ˄
        </button>

        <button
          type="button"
          :class="['editor-button', 'arrow']"
          @click="$emit('change-font-size', 'down')">
          ˅
        </button>

        <button
          type="button"
          :class="['editor-button', 'family-control']"
          @click="$emit('change-font-family')">
          f
        </button>

        <button
          type="button"
          :class="['editor-button', 'color-control', { active: colorpicker }]"
          @click="openColorEditor">
          c
        </button>

      </div>
    </div>

    <div
      v-if="text"
      class="text-feel"
      :style="textStyles">
      {{ text }}
    </div>

  </div>
</template>

<script>
// ====================================================================== Export
export default {
  name: 'Editor',

  props: {
    text: {
      type: String,
      required: true,
      default: ''
    },
    fontsize: {
      type: Number,
      required: true,
      default: 13
    },
    fontcolor: {
      type: String,
      required: false,
      default: '#000000'
    },
    editor: {
      type: Boolean,
      required: true,
      default: false
    },
    propboard: {
      type: Boolean,
      required: false,
      default: false
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
        '--color-control': this.color
      }
    },
    textStyles () {
      return {
        'font-size': this.fontsize + 'px',
        color: this.color ? this.color : this.fontcolor
      }
    }
  },

  methods: {
    openColorEditor () {
      this.colorpicker = !this.colorpicker
      const ctn = this.$refs.editorContainer
      this.width = ctn.clientWidth
      this.height = ctn.clientHeight
    },
    closeColorEditor () {
      if (this.colorpicker) {
        this.colorpicker = false
        if (this.color) {
          if (this.propboard) {
            this.$emit('change-color', this.color, true)
          } else {
            this.$emit('change-color', this.color)
          }
        }
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
        if (this.propboard) {
          this.$emit('change-color', this.color)
        }
      }
    }
  }
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.text-thingie {
  pointer-events: none;
  overflow: hidden;
}

// ////////////////////////////////////////////////////////////////////// Editor
.thingie-editor {
  --color-control: #000000;
  pointer-events: auto;
  position: absolute;
  top: -0.75rem;
  left: calc(100% + 1.75rem);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  &.editor {
    top: -1rem;
    left: -1rem;
    width: calc(100% + 2rem);
    height: calc(100% + 2rem);
    &.colorpicker {
      z-index: 2;
      cursor: pointer;
      .editor-button.color-control {
        color: var(--color-control);
      }
    }
    .editor-toolbar {
      left: calc(100% + 1rem);
      top: 0;
    }
  }
}

.editor-toolbar {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  width: 1.25rem;
  height: 100%;
  position: absolute;
}

.color-control {
  &.active {
    @include fontWeight_Bold;
    transform: scale(1.25);
  }
}

.editor-button {
  pointer-events: auto;
  padding: 0.25rem;
  line-height: 1;
  color: $salt;
  text-align: center;
  @include link;
  @include fontSize_Bigger;
  @include linkHover($salt);
}

// //////////////////////////////////////////////////////////////////////// Text
.text-feel {
  position: relative;
  width: fit-content;
  margin: auto;
  z-index: 0;
  pointer-events: none;
  font-family: inherit;
}
</style>
