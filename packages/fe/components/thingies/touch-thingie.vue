<template>
  <div
    ref="thingieRef"
    draggable
    :class="['touch-thingie', { locked: !authenticated }, { editing }]"
    :style="styles"
    tabindex="1"
    v-hammer:tap="(evt) => thingieEditor(evt)"
    v-hammer:pinchstart="setInitWidth"
    v-hammer:pinch="(evt) => pinch(evt)"
    v-hammer:pinchend="clearInitWidth"
    v-hammer:rotatestart="setInitAngle"
    v-hammer:rotate="(evt) => rotateThingie(evt)"
    v-hammer:rotateend="clearInitAngle"
    v-touch-outside="closeEditor(evt)">

    <TextThingie
      v-if="type === 'text'"
      :touch-enabled="true"
      :text="thingie.text"
      :editor="false"
      :fontsize="fontsize"
      :fontcolor="highlight"
      :class="fontfamily" />

    <ImageThingie
      v-if="type === 'image'"
      :touch-enabled="true"
      :image="thingie.file_ref._id"
      :filetype="thingie.file_ref.file_ext"
      :clip="thingie.clip"
      :clip-path="thingie.path_data"
      :editor="false" />

    <SoundThingie
      v-if="type === 'sound'"
      :touch-enabled="true"
      :audio="thingie.file_ref._id"
      :filetype="thingie.file_ref.file_ext"
      :gain="gain"
      :path="thingie.path_data"
      :editor="false"
      :colors="thingie.colors"
      :position="position"
      :width="width"
      :stroke-width="strokeWidth" />

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
      editing: false,
      touchstart: false,
      initAngle: false,
      initWidth: false
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
    thingie: {
      handler () {
        if (this.editorThingie._id === this.thingie._id) {
          this.setEditorThingie(this.thingie)
        }
      },
      deep: true
    },
    editorThingie (val) {
      if (val._id === this.thingie._id) {
        this.editing = true
      } else {
        this.editing = false
      }
    }
  },

  mounted () {
    if (this.$refs.thingieRef) {
      const thingie = this.$refs.thingieRef
      this.touchstart = (evt) => { this.panstart(evt) }
      thingie.addEventListener('touchstart', this.touchstart, { passive: false })
    }
  },

  beforeDestroy () {
    if (this.touchstart && this.$refs.thingieRef.$el) {
      this.$refs.thingieRef.removeEventListener('touchstart', this.touchstart)
    }
  },

  methods: {
    ...mapActions({
      setEditorThingie: 'collections/setEditorThingie',
      clearEditorThingie: 'collections/clearEditorThingie'
    }),
    panstart (evt) {
      if (this.authenticated && !this.thingie.dragging && this.editing) {
        evt.preventDefault()
        const thingie = this.$el
        const thingieRect = thingie.getBoundingClientRect()
        this.handleX = evt.touches[0].clientX - thingieRect.left
        this.handleY = evt.touches[0].clientY - thingieRect.top
        document.ontouchmove = this.$throttle((e) => { this.drag(e) })
        document.ontouchend = this.panend
        this.$emit('initmousedown', { _id: this.thingie._id })
      }
    },
    drag (evt) {
      if (this.authenticated) {
        evt.preventDefault()
        if (evt.touches.length < 2) {
          console.log(evt)
          const parent = this.$parent.$el
          const rect = parent.getBoundingClientRect()
          let x = Math.max(0, Math.min(this.bounds.x - this.width, evt.touches[0].clientX - rect.left - this.handleX))
          let y = Math.max(0, Math.min(this.bounds.y - this.height, evt.touches[0].clientY - rect.top - this.handleY))
          if (this.thingie.location === 'pocket') {
            const thingie = this.$el
            const thingieRect = thingie.getBoundingClientRect()
            x = Math.min(640 - thingieRect.width, x)
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
      }
    },
    panend (evt) {
      if (this.authenticated) {
        evt.preventDefault()
        this.handleX = false
        this.handleY = false
        document.ontouchmove = null
        document.ontouchend = null
        this.$emit('initmouseup', { _id: this.thingie._id })
      }
    },
    setInitWidth () {
      if (this.authenticated && this.editing) {
        this.initWidth = !Number.isNaN(this.thingie.width) ? this.thingie.width : 80
      }
    },
    pinch (evt) {
      if (this.authenticated && this.editing && this.initWidth !== false) {
        evt.preventDefault()
        const width = this.thingie.width ? this.thingie.width : 80
        const newWidth = Math.max(this.initWidth * evt.scale, 1)
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
    clearInitWidth () {
      this.initWidth = false
    },
    setInitAngle () {
      if (this.authenticated && this.editing) {
        this.initAngle = !Number.isNaN(this.thingie.angle) ? this.thingie.angle : 0
      }
    },
    rotateThingie (evt) {
      if (this.authenticated && this.editing) {
        const offset = !Number.isNaN(this.initAngle) ? this.initAngle : 0
        const newAngle = evt.rotation + this.initAngle
        this.$emit('initupdate', {
          _id: this.thingie._id,
          angle: newAngle
        })
      }
    },
    clearInitAngle () {
      this.initAngle = false
    },
    thingieEditor (evt) {
      console.log(evt)
      if (this.authenticated) {
        evt.preventDefault()
        if (!this.editorThingie || this.editorThingie._id !== this.thingie._id) {
          this.setEditorThingie(this.thingie)
        } else {
          this.clearEditorThingie()
        }
      }
    },
    closeEditor (evt) {
      console.log('close editor')
      console.log(evt)
      if (this.editorThingie) {
        this.clearEditorThingie()
      }
    }
  }
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.touch-thingie {
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
