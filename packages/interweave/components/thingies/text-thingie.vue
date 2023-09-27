<template>
  <div
    class="text-thingie"
    :style="thingieStyles">

    <div
      ref="editorContainer"
      :class="['color-editor', { colorpicker }]"
      :style="editorStyles"
      @click.self="closeColorEditor"
      @mousemove.capture="handleMouseMove($event)">
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
  name: 'TextThingie',

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
    colorpicker: {
      type: Boolean,
      required: true,
      default: false
    },
    propboard: {
      type: Boolean,
      required: false,
      default: false
    },
    css: {
      type: [Boolean, Array],
      required: false,
      default: false
    }
  },

  data () {
    return {
      width: 320,
      height: 128,
      color: ''
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
    },
    thingieStyles () {
      if (Array.isArray(this.css)) {
        const styles = {}
        this.css.forEach((line) => {
          const props = line.split(':')
          const key = props[0]
          const value = props[1]
          styles[key] = value
        })
        return styles
      }
      return false
    }
  },

  watch: {
    colorpicker () {
      const ctn = this.$refs.editorContainer
      this.width = ctn.clientWidth
      this.height = ctn.clientHeight
    }
  },

  methods: {
    closeColorEditor () {
      if (this.colorpicker) {
        this.$emit('close-color-editor')
        if (this.color) {
          this.$emit('change-color', this.color)
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
        this.$emit('change-color', this.color)
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
.color-editor {
  pointer-events: auto;
  position: absolute;
  top: -0.75rem;
  left: calc(100% + 1.75rem);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  top: -1rem;
  left: -1rem;
  width: calc(100% + 2rem);
  height: calc(100% + 2rem);
  z-index: 0;
  cursor: pointer;
  visibility: hidden;
  &.colorpicker {
    visibility: visible;
  }
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
