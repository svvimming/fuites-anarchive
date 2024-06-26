<template>
  <div
    :data-thingie-id="thingie._id" 
    :class="['touch-editor', { expanded }, { pocketIsOpen }]">
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
          <div
            ref="colorpicker"
            :data-thingie-id="thingie._id"
            class="color-picker"
            @touchstart="touchstart">
          </div>
        </div>

        <div
          :data-thingie-id="thingie._id"
          class="grid-spaceBetween move-thingie-toolbar">

          <button
            v-for="button in destinations"
            :key="button.text"
            type="button"
            :data-thingie-id="thingie._id"
            :class="['col-5', 'touch-button', 'move-thingie', 'control', button.location]"
            @click="moveThingie(button.location)">
            <span :data-thingie-id="thingie._id">
              {{ button.text }}
            </span>
          </button>

          <button
            v-if="$route.params.id === 'compost'"
            type="button"
            :data-thingie-id="thingie._id"
            :class="['col-5', 'touch-button', 'move-thingie', 'control', 'delete']"
            @click="$emit('delete-thingie')">
            <span :data-thingie-id="thingie._id">
              delete
            </span>
          </button>

        </div>

        <div 
          :data-thingie-id="thingie._id" 
          class="grid-center controls">
          <button
            v-for="button in controls"
            :key="button.inner"
            type="button"
            :data-thingie-id="thingie._id"
            :class="['col-3', 'touch-button', 'control', button.classes]"
            @click="handleControlClick(button.directive, button.value)">
            {{ button.inner }}
          </button>
          <button
            v-for="button in shared"
            :key="button.inner"
            type="button"
            :data-thingie-id="thingie._id"
            :class="['col-3', 'touch-button', 'control', button.classes]"
            @click="handleControlClick(button.directive, button.value)">
            {{ button.inner }}
          </button>
        </div>

      </div>

    </div>
  </div>
</template>

<script>
// ====================================================================== Import
import { mapGetters, mapActions } from 'vuex'
import CloneDeep from 'lodash/cloneDeep'

import EditableParams from '@/data/thingie-editable-params.json'

// ====================================================================== Export
export default {
  name: 'TouchEditor',

  props: {
    currentPage: {
      type: String,
      required: true
    },
    expanded: {
      type: Boolean,
      required: true,
      default: false
    }
  },

  data () {
    return {
      colorpicker: false,
      textColor: '',
      destinations: []
    }
  },

  computed: {
    ...mapGetters({
      landing: 'general/landing',
      zindices: 'collections/zindices',
      pocketIsOpen: 'pocket/pocketIsOpen',
      thingie: 'collections/editorThingie'
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
    expanded (val) {
      if (!val) {
        if (this.colorpicker) { this.colorpicker = false }
        if (this.thingie) {
          this.clearEditorThingie()
        }
      }
    },
    thingie (val) {
      if (val) {
        this.setDestinations()
      }
    }
  },

  methods: {
    ...mapActions({
      clearEditorThingie: 'collections/clearEditorThingie'
    }),
    handleControlClick (directive, value) {
      this[directive](value)
    },
    moveThingie (newLocation) {
      const thingie = CloneDeep(this.thingie)
      let x = thingie.at.x
      let y = thingie.at.y
      if (newLocation === 'pocket') {
        x = Math.floor(Math.random() * 560) - thingie.width + 40
        y = Math.floor(Math.random() * 300)
      }
      if (newLocation === this.currentPage) {
        x = window.scrollX + Math.floor(Math.random() * window.innerWidth) - thingie.width
        y = window.scrollY + Math.floor(Math.random() * window.innerHeight) - 100
      }
      this.$emit('initupdate', { 
        _id: thingie._id, 
        location: newLocation,
        at: { x, y, z: 1 },
        record_new_location: true
      })
      this.clearEditorThingie()
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
    changeOpacity () {
      let opacity = this.thingie.opacity ? this.thingie.opacity : 1.0
      opacity -= 0.1
      if (opacity < 0.1) { opacity = 1.0 }
      this.$emit('initupdate', { _id: this.thingie._id, opacity })
    },
    touchstart () {
      document.ontouchmove = this.$throttle((e) => { this.touchmove(e) }, 50)
      document.ontouchend = this.touchend
    },
    touchmove (evt) {
      evt.preventDefault()
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
    },
    touchend () {
      document.ontouchmove = null
      document.ontouchend = null
      this.closeColorEditor()
    },
    setDestinations () {
      const possibleLocations = [
        { location: this.currentPage, text: `move to ${this.currentPage}` },
        { location: 'pocket', text: 'move to pocket' }
      ]
      if (this.$route.params.id !== 'compost') {
        possibleLocations.unshift({ location: 'compost', text: 'move to compost' })
      }
      this.destinations = possibleLocations.filter(item => item.location !== this.thingie.location)
    }
  }
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.touch-editor {
  position: fixed;
  display: block;
  bottom: calc($touchmodeToolbarHeight + 0.5px);
  left: 0;
  width: 100%;
  background-color: white;
  z-index: 10001;
  &.active {
    &.pocketIsOpen {
      .section-controls {
        height: 200px;
      }
    }
  }
  &.expanded {
    border-top: solid 0.5px rgba($salt, 0.3);
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

.color-modal,
.controls,
.move-thingie-toolbar {
  z-index: 1;
}

.move-thingie-toolbar {
  margin-top: 0.5rem;
  margin-bottom: 0.75rem;
}

.touch-button {
  display: block;
  padding: 0.5rem 0;
  &.control {
    padding: 0.375rem 1rem;
    @include fontWeight_Bold;
    font-size: 1.125rem;
    margin: 0.25rem;
    box-shadow: 1px 1px 7px rgba($lavender, 0.5);
    border-radius: 0.25rem;
  }
  &.move-thingie {
    padding: 0.5rem 1rem;
    font-size: 1rem;
    &.pocket,
    &.compost {
      position: relative;
      &:before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-size: cover;
        background-repeat: no-repeat;
        background-position: center;
        opacity: 0.33;
      }
      span {
        position: relative;
        color: #000000;
        @include fontWeight_Bold;
        @include linkHover(#000000);
        white-space: nowrap;
      }
    }
    &.pocket {
      &:before {
        background-image: url('~/assets/images/pocket-background.jpg');
      }
    }
    &.compost {
      &:before {
        background-image: url('~/assets/images/compost-portal-background.jpg');
      }
    }
  }
}

.color-modal {
  --color-control: rgba(189, 187, 215, 1);
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
  background-color: rgba(#f2f1f7, 0.8);
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
