<template>
  <div
    ref="thingieRef"
    draggable
    :class="['thingie', { locked: !authenticated }, { editing }]"
    :style="styles"
    tabindex="1"
    :data-thingie-id="thingie._id"
    @mousedown="mousedown($event)"
    @dragstart="startDrag($event)"
    @wheel="wheel($event)"
    @click.alt.self="thingieEditor($event)"
    v-click-outside="closeEditor">

    <TextThingie
      v-if="type === 'text'"
      :text="thingie.text"
      :editor="editing"
      :fontsize="fontsize"
      :fontcolor="highlight"
      :class="fontfamily"
      @change-font-size="changeFontSize"
      @change-font-family="changeFontFamily"
      @change-color="changeTextColor" />

    <ImageThingie
      v-if="type === 'image'"
      :image="thingie.file_ref._id"
      :filetype="thingie.file_ref.file_ext"
      :clip="thingie.clip"
      :clip-path="thingie.path_data"
      :editor="editing"
      @toggle-clip-path="toggleImageClip" />

    <SoundThingie
      v-if="type === 'sound'"
      :audio="thingie.file_ref._id"
      :filetype="thingie.file_ref.file_ext"
      :gain="gain"
      :path="thingie.path_data"
      :editor="editing"
      :colors="thingie.colors"
      :position="position"
      :width="width"
      :stroke-width="strokeWidth"
      @change-stroke-width="changePathStrokeWidth"
      @change-sound-level="changeSoundLevel" />

  </div>
</template>

<script>
// ====================================================================== Import
import { mapGetters, mapActions } from 'vuex'

import TextThingie from '@/components/thingies/text-thingie'
import ImageThingie from '@/components/thingies/image-thingie'
import SoundThingie from '@/components/thingies/sound-thingie'

// ====================================================================== Export
export default {
  name: 'Thingie',

  components: {
    TextThingie,
    ImageThingie,
    SoundThingie
  },

  props: {
    thingie: {
      type: Object,
      required: true
    },
    bounds: {
      type: Object,
      required: true,
      default: () => ({
        x: 0,
        y: 0
      })
    }
  },

  data () {
    return {
      handleX: false,
      handleY: false,
      editing: false
    }
  },

  computed: {
    ...mapGetters({
      landing: 'general/landing',
      authenticated: 'general/authenticated',
      zindices: 'collections/zindices',
      editorThingie: 'collections/editorThingie'
    }),
    fonts () {
      return this.landing.data.font_families
    },
    type () {
      return this.thingie.thingie_type
    },
    position () {
      return this.thingie.at
    },
    width () {
      return this.thingie.width ? this.thingie.width : 80
    },
    height () {
      if (this.thingie.file_ref && this.thingie.file_ref.aspect) {
        return this.width / this.thingie.file_ref.aspect
      }
      return this.width
    },
    rotate () {
      return this.thingie.angle
    },
    fontfamily () {
      return this.thingie.fontfamily ? this.thingie.fontfamily : 'nanum'
    },
    fontsize () {
      return this.thingie.fontsize ? this.thingie.fontsize : 13
    },
    highlight () {
      return this.thingie.colors.length ? this.thingie.colors[0] : ''
    },
    styles () {
      const styles = {
        left: this.position.x + 'px',
        top: this.position.y + 'px',
        'z-index': this.position.z,
        width: this.width + 'px',
        height: this.type !== 'text' ? `${this.height}px` : 'unset',
        transform: `rotate(${this.rotate}deg)`,
        '--highlight-color': this.thingie.colors[0]
      }
      return styles
    },
    clipPath () {
      return this.thingie.clip
    },
    clipPathData () {
      if (this.thingie.path_data) {
        return this.thingie.path_data
      }
      return ''
    },
    strokeWidth () {
      return typeof this.thingie.stroke_width === 'number' ? this.thingie.stroke_width : 3
    },
    gain () {
      return this.thingie.gain ? this.thingie.gain : 1
    }
  },

  watch: {
    editing (val) {
      if (val) {
        this.setEditorThingie(this.thingie)
        document.onkeydown = (e) => { this.handleKeydown(e) }
      } else {
        if (this.editorThingie && (this.editorThingie._id === this.thingie._id)) {
          this.clearEditorThingie(this.thingie)
        }
        document.onkeydown = null
      }
    }
  },

  methods: {
    ...mapActions({
      setEditorThingie: 'collections/setEditorThingie',
      clearEditorThingie: 'collections/clearEditorThingie'
    }),
    mousedown (evt) {
      if (this.authenticated) {
        if (!evt.shiftKey && !evt.metaKey && !this.thingie.dragging) {
          evt.preventDefault()
          const thingie = this.$el
          const thingieRect = thingie.getBoundingClientRect()
          this.handleX = evt.clientX - thingieRect.left
          this.handleY = evt.clientY - thingieRect.top
          document.onmousemove = this.$throttle((e) => { this.drag(e) })
          document.onmouseup = this.mouseup
          this.$emit('initmousedown', { _id: this.thingie._id })
        }
      }
    },
    drag (evt) {
      if (this.authenticated) {
        evt.preventDefault()
        const parent = this.$parent.$el
        const rect = parent.getBoundingClientRect()
        const thingie = this.$el
        const thingieRect = thingie.getBoundingClientRect()
        let x = Math.max(0, Math.min(this.bounds.x - this.width, evt.clientX - rect.left - this.handleX))
        let y = Math.max(0, Math.min(this.bounds.y - thingieRect.height, evt.clientY - rect.top - this.handleY))
        if (this.thingie.location === 'pocket') {
          x = Math.min(640 - this.width, x)
          y = Math.min(400 - thingieRect.height, y)
        }
        this.$emit('initupdate', {
          _id: this.thingie._id,
          at: {
            x: x,
            y: y,
            z: this.position.z
          }
        })
      }
    },
    mouseup (evt) {
      if (this.authenticated) {
        evt.preventDefault()
        this.handleX = false
        this.handleY = false
        document.onmousemove = null
        document.onmouseup = null
        this.$emit('initmouseup', { _id: this.thingie._id })
      }
    },
    startDrag (evt) {
      if (this.authenticated) {
        evt.dataTransfer.dropEffect = 'move'
        evt.dataTransfer.effectAllowed = 'move'
        evt.dataTransfer.setData('_id', this.thingie._id)
      }
    },
    wheel (evt) {
      if (this.authenticated && this.editing) {
        evt.preventDefault();
        const width = this.thingie.width ? this.thingie.width : 80
        const newWidth = Math.max(width - evt.deltaY, 1)
        const delta = (width - newWidth) / 2
        this.$emit('initupdate', {
          _id: this.thingie._id,
          width: newWidth,
          at: {
            x: this.thingie.at.x + delta,
            y: this.thingie.at.y + delta,
            z: this.thingie.at.z
          }
        })
      }
    },
    thingieEditor (evt) {
      if (this.authenticated) {
        evt.preventDefault()
        this.editing = !this.editing
      }
    },
    closeEditor () {
      if (this.editing) {
        this.editing = false
      }
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
    changeTextColor (incoming) {
      const colors = this.thingie.colors
      let newColors = [incoming].concat(colors)
      if (newColors.length > 10) { newColors = newColors.slice(0, 10) }
      this.$emit('initupdate', {
        _id: this.thingie._id,
        colors: newColors
      })
    },
    rotateThingie (delta) {
      const angle = !Number.isNaN(this.thingie.angle) ? this.thingie.angle : 0
      const newAngle = angle - delta
      this.$emit('initupdate', {
        _id: this.thingie._id,
        angle: newAngle
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
    toggleImageClip (val) {
      this.$emit('initupdate', {
        _id: this.thingie._id,
        clip: val
      })
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
    handleKeydown (e) {
      e.preventDefault()
      if (e.keyCode === 38 || e.key === 'ArrowUp') {
        this.changeZindex('front')
      } else if (e.keyCode === 40 || e.key === 'ArrowDown') {
        this.changeZindex('back')
      } else if (e.keyCode === 37 || e.key === 'ArrowLeft') {
        this.rotateThingie(1)
        this.$pressKeyAndHold(document, 500, () => {
          this.rotateThingie(2)
        })
      } else if (e.keyCode === 39 || e.key === 'ArrowRight') {
        this.rotateThingie(-1)
        this.$pressKeyAndHold(document, 500, () => {
          this.rotateThingie(-2)
        })
      }
    }
  }
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.thingie {
  --highlight-color: #cbc0d9;
  position: absolute;
  width: 80px;
  cursor: grab;
  transform-origin: center;
  &:active {
    cursor: grabbing;
  }
  img {
    width: 100%;
  }
  img,
  svg {
    pointer-events: none;
  }
  &.locked {
    pointer-events: none;
  }
  &.editing {
    &:before {
      content: '';
      position: absolute;
      top: -1rem;
      left: -1rem;
      width: calc(100% + 2rem);
      height: calc(100% + 2rem);
      opacity: 0.5;
      border-radius: 0.25rem;
      box-shadow: 0 0 3px 3px var(--highlight-color);
    }
  }
  :deep(.image-thingie) {
    .clip-toggle-button {
      color: var(--highlight-color);
    }
  }
}
</style>
