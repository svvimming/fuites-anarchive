<template>
  <div
    :data-thingie-id="thingie._id" 
    :class="['touch-editor', { active }, { expanded }]">
    <div
      :data-thingie-id="thingie._id" 
      class="editor">

      <div
        :data-thingie-id="thingie._id"
        class="section-controls">

        <div
          :data-thingie-id="thingie._id"
          :class="['color-modal', { open: colorpicker }]"
          :style="{ '--color-control': textColor }">
       <!--    <div
            ref="colorpicker"
            class="color-picker"
            v-hammer:panmove="handleTouchMove($event)"
            v-hammer:panend="closeColorEditor">
          </div> -->
        </div>

        <div
          :data-thingie-id="thingie._id"
          class="move-thingie">
          <button
            v-if="thingie.location !== 'compost'"
            type="button"
            :data-thingie-id="thingie._id"
            class="touch-button"
            @click="moveThingie('compost')">
            move to compost
          </button>
          <button
            v-if="thingie.location !== 'pocket'"
            type="button"
            :data-thingie-id="thingie._id"
            class="touch-button"
            @click="moveThingie('pocket')">
            move to pocket
          </button>
          <button
            v-if="thingie.location !== currentSpaze"
            type="button"
            :data-thingie-id="thingie._id"
            class="touch-button"
            @click="moveThingie(currentSpaze)">
            move to spaze
          </button>
        </div>

        <div :data-thingie-id="thingie._id" class="controls">
          <button
            v-for="button in controls"
            :key="button.inner"
            type="button"
            :data-thingie-id="thingie._id"
            :class="['touch-button', button.classes]"
            @click="handleControlClick(button.directive, button.value)">
            {{ button.inner }}
          </button>
          <button
            v-for="button in shared"
            :key="button.inner"
            type="button"
            :data-thingie-id="thingie._id"
            :class="['touch-button', button.classes]"
            @click="handleControlClick(button.directive, button.value)">
            {{ button.inner }}
          </button>
        </div>

      </div>

      <div :data-thingie-id="thingie._id" class="section-toggle">
        <button
          type="button"
          :data-thingie-id="thingie._id"
          class="touch-button"
          @click="toggleEditor">
          edit
        </button>
        <button
          type="button"
          :data-thingie-id="thingie._id"
          class="touch-button"
          @click="$emit('close-editor')">
          X
        </button>
      </div>

    </div>
  </div>
</template>

<script>
// ====================================================================== Import
import { mapGetters } from 'vuex'

import EditableParams from '@/data/thingie-editable-params.json'

// ====================================================================== Export
export default {
  name: 'TouchEditor',

  props: {
    thingie: {
      type: [Boolean, Object],
      required: true,
      default: false
    },
    currentSpaze: {
      type: String,
      required: true
    }
  },

  data () {
    return {
      active: false,
      expanded: false,
      colorpicker: false,
      textColor: ''
    }
  },

  computed: {
    ...mapGetters({
      landing: 'general/landing',
      zindices: 'collections/zindices'
    }),
    position () {
      return this.thingie.at
    },
    fonts () {
      return this.landing.data.font_families
    },
    fontfamily () {
      return this.thingie && this.thingie.fontfamily ? this.thingie.fontfamily : 'nanum'
    },
    fontsize () {
      return this.thingie && this.thingie.fontsize ? this.thingie.fontsize : 13
    },
    gain () {
      return this.thingie.gain ? this.thingie.gain : 1
    },
    thingieType () {
      if (this.thingie) {
        return ['image', 'text', 'sound'].includes(this.thingie.thingie_type) ? this.thingie.thingie_type : false
      }
      return false
    },
    controls () {
      if (this.thingieType) { return EditableParams[this.thingieType] }
      return []
    },
    shared () {
      return EditableParams.shared
    }
  },

  watch: {
    thingie (val) {
      if (val) {
        this.active = true
      } else {
        this.active = false
      }
    }
  },

  methods: {
    toggleEditor () {
      this.expanded = !this.expanded
    },
    handleControlClick (directive, value) {
      this[directive](value)
    },
    moveThingie (newLocation) {
      this.$emit('initupdate', { 
        _id: this.thingie._id, 
        location: newLocation,
        record_new_location: true
      })
      this.$emit('close-editor')
    },
    toggleImageClip () {
      this.$emit('initupdate', {
        _id: this.thingie._id,
        clip: !this.thingie.clip
      })
    },
    changeFontSize (direction) {
      const fs = this.fontsize
      if (direction === 'up') {
        this.$emit('initupdate', {
          _id: this.thingie._id,
          fontsize: Math.min(500, fs + 1)
        })
      }
      if (direction === 'down') {
        this.$emit('initupdate', {
          _id: this.thingie._id,
          fontsize: Math.max(1, fs - 1)
        })
      }
    },
    changeFontFamily () {
      const current = this.fonts.indexOf(this.fontfamily)
      const index = (current + 1) % this.fonts.length
      const family = this.fonts[index]
      this.$emit('initupdate', {
        _id: this.thingie._id,
        fontfamily: family
      })
    },
    changeZindex (direction) {
      if (direction === 'front') {
        const max = this.zindices[this.thingie.location].max
        this.$emit('initupdate', {
          _id: this.thingie._id,
          at: { x: this.position.x, y: this.position.y, z: max + 1 }
        })
      }
      if (direction === 'back') {
        const min = this.zindices[this.thingie.location].min
        this.$emit('initupdate', {
          _id: this.thingie._id,
          at: { x: this.position.x, y: this.position.y, z: min - 1 }
        })
      }
    },
    changePathStrokeWidth (val) {
      const stroke = typeof this.thingie.stroke_width === 'number' ? this.thingie.stroke_width : 3
      const increment = val === 'up' ? 1 : -1
      this.$emit('initupdate', {
        _id: this.thingie._id,
        stroke_width: stroke + increment
      })
    },
    changeSoundLevel (val) {
      const gain = val === 'up' ? Math.min(this.gain + 0.1, 3.0) : Math.max(this.gain - 0.1, 0.1)
      this.$emit('initupdate', { _id: this.thingie._id, gain })
    },
    openColorEditor () {
      this.colorpicker = !this.colorpicker
    },
    closeColorEditor () {
      if (this.colorpicker) {
        this.colorpicker = false
        if (this.textColor) {
          const colors = this.thingie.colors
          let newColors = [this.textColor].concat(colors)
          if (newColors.length > 10) { newColors = newColors.slice(0, 10) }
          this.$emit('initupdate', {
            _id: this.thingie._id,
            colors: newColors
          })
        }
      }
    },
    handleTouchMove (evt) {
      const editor = this.$refs.colorpicker
      if (editor) {
        const editorRect = editor.getBoundingClientRect()
        const mouseX = evt.touches[0].clientX - editorRect.left
        const mouseY = evt.touches[0].clientY - editorRect.top
        const h = Math.floor((mouseX / editorRect.width) * 360)
        const g = Math.floor((mouseY / editorRect.height) * 100)
        const l = Math.max(g - 11, 0)
        const rgb = this.$convertHSLtoRGB(h, g, l)
        this.textColor = this.$convertRGBtoHex(rgb[0], rgb[1], rgb[2])
      }
    }
  }
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.touch-editor {
  position: fixed;
  display: none;
  bottom: 0;
  left: 0;
  width: 100%;
  background-color: white;
  border-top: solid 1px $gray400;
  z-index: 10001;
  &.active {
    display: block;
  }
  &.expanded {
    .section-controls {
      height: 200px;
    }
  }
}

.section-controls {
  position: relative;
  display: block;
  height: 0;
  overflow: hidden;
  transition: height 300ms ease;
}

.section-toggle {
  display: flex;
  height: 3.5rem;
}

.section-toggle,
.controls,
.move-thingie {
  position: relative;
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.color-modal,
.controls,
.move-thingie {
  z-index: 1;
}

.touch-button {
  display: block;
  padding: 0 1rem;
}

.color-modal {
  --color-control: #000000;
  display: none;
  pointer-events: auto;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: rgba($lavender, 0.2);
  &.open {
    display: flex;
    z-index: 2;
  }
  .color-picker {
    width: 10rem;
    height: 7rem;
    background-color: rgba(white, 0.8);
    cursor: pointer;
    border-radius: 0.25rem;
    box-shadow: 0 0 3px 3px var(--color-control);
    .editor-button.color-control {
      color: var(--color-control);
    }
  }
}
</style>
