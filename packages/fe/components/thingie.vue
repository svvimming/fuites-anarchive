<template>
  <div
    draggable
    :class="['thingie', `${type}-thingie`, { locked: !authenticated }]"
    :style="styles"
    @mousedown="mousedown($event)"
    @dragstart="startDrag($event)"
    @wheel="wheel($event)">

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
      handleY: false
    }
  },

  computed: {
    ...mapGetters({
      authenticated: 'general/authenticated'
    }),
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
    styles () {
      return {
        left: this.position.x + 'px',
        top: this.position.y + 'px',
        zIndex: this.position.z + 'px',
        width: this.scale + 'px',
        transform: `rotate(${this.rotate}deg)`
        // '--relative-font-size': `${this.scale * 13 / 80}px`
      }
    }
  },

  methods: {
    ...mapActions({
      updateThingie: 'collections/updateThingie'
    }),
    mousedown (evt) {
      if (this.authenticated) {
        if (!evt.shiftKey && !this.thingie.dragging) {
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
        console.log('hit')
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
}

.thingie.text-thingie {
  // --relative-font-size: 13px;
  ::v-deep .text-feel {
    position: relative;
    width: fit-content;
    margin: auto;
    z-index: 0;
    pointer-events: none;
    // font-size: var(--relative-font-size);
  }
}
</style>
