<template>
  <div
    draggable
    :class="['thingie', `${type}-thingie`, { locked: !authenticated }, { editor }, fontfamily]"
    :style="styles"
    tabindex="1"
    @mousedown="mousedown($event)"
    @dragstart="startDrag($event)"
    @wheel="wheel($event)"
    @click.meta="thingieEditor($event)"
    v-click-outside="closeEditor">

    <div
      v-if="type === 'text' && editor && authenticated"
      class="thingie-editor">
      <div class="font-size-control">
        <button
          class="editor-button"
          @click="changeFontSize('up')">
          ˄
        </button>
        <button
          class="editor-button"
          @click="changeFontSize('down')">
          ˅
        </button>
      </div>
      <div class="font-family-control">
        <button
          class="editor-button"
          @click="changeFontFamily">
          f
        </button>
      </div>
    </div>

    <slot></slot>

  </div>
</template>

<script>
// ====================================================================== Import
import { mapGetters, mapActions } from 'vuex'

// ====================================================================== Export
export default {
  name: 'Thingie',

  props: {
    thingie: {
      type: Object,
      required: true
    }
  },

  data () {
    return {
      handleX: false,
      handleY: false,
      editor: false
    }
  },

  computed: {
    ...mapGetters({
      landing: 'general/landing',
      authenticated: 'general/authenticated'
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
    scale () {
      return this.thingie.width ? this.thingie.width : 80
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
    styles () {
      const styles = {
        left: this.position.x + 'px',
        top: this.position.y + 'px',
        zIndex: this.position.z + 'px',
        width: this.scale + 'px',
        transform: `rotate(${this.rotate}deg)`
      }
      if (this.type === 'text') {
        styles['--thingie-font-size'] = `${this.thingie.fontsize}px`
      }
      return styles
    }
  },

  methods: {
    ...mapActions({
      updateThingie: 'collections/updateThingie'
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
        let x = Math.max(0, evt.clientX - rect.left - this.handleX)
        let y = Math.max(0, evt.clientY - rect.top - this.handleY)
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
      if (this.authenticated) {
        evt.preventDefault();
        if (evt.ctrlKey) {
          if (evt.altKey) {
            const angle = !Number.isNaN(this.thingie.angle) ? this.thingie.angle : 0
            const newAngle = angle - evt.deltaY
            this.$emit('initupdate', {
              _id: this.thingie._id,
              angle: newAngle
            })
          } else {
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
        }
      }
    },
    thingieEditor (evt) {
      if (this.authenticated) {
        evt.preventDefault()
        this.editor = !this.editor
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
    closeEditor () {
      if (this.editor) {
        this.editor = false
      }
    }
  },

  render () {
    return this.$scopedSlots.default({
      mousedown: this.mousedown,
      mouseup: this.mouseup,
      startDrag: this.startDrag,
      styles: this.styles
    })
  }
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.thingie {
  position: absolute;
  width: 80px;
  cursor: grab;
  transform-origin: center;
  // transition: all 100ms linear;
  &.image-thingie,
  &.text-thingie,
  &.sound-thingie,
  &.video-thingie {
  }
  &:active {
    cursor: grabbing;
  }
  img {
    width: 100%;
    pointer-events: none;
  }
  &.locked {
    pointer-events: none;
  }
  &.editor {
    &:before {
      content: '';
      position: absolute;
      top: -1rem;
      left: -1rem;
      width: calc(100% + 3rem);
      height: calc(100% + 2rem);
      @include focusBoxShadowSmall;
      border-radius: 0.25rem;
    }
  }
}

.thingie.text-thingie {
  --thingie-font-size: 13px;
  ::v-deep .text-feel {
    position: relative;
    width: fit-content;
    margin: auto;
    z-index: 0;
    pointer-events: none;
    font-size: var(--thingie-font-size);
  }
}

.thingie-editor {
  position: absolute;
  top: 0;
  right: -0.5rem;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transform: translateX(100%);
}

.font-size-control {
  display: flex;
  flex-direction: column;
}

.editor-button {
  padding: 0.25rem;
  @include link;
  @include fontSize_Bigger;
  @include linkHover(#000000);
}

</style>
