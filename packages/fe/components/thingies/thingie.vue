<template>
  <div
    ref="thingieRef"
    draggable
    :class="['thingie', `${type}-thingie`, { locked: !authenticated }, { editor }, fontfamily]"
    :style="styles"
    tabindex="1"
    @mousedown="mousedown($event)"
    @dragstart="startDrag($event)"
    @wheel="wheel($event)"
    @click.alt.self="thingieEditor($event)"
    v-click-outside="closeEditor">

    <Editor
      v-if="authenticated"
      :open="editor"
      :type="type"
      @change-font-size="changeFontSize"
      @change-font-family="changeFontFamily"
      @rotate-thingie="rotateThingie"
      @change-zindex="changeZindex" />

    <svg
      v-if="clipPath && clipPathData"
      class="clip-path-svg"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200">
    	<defs>
    		<clipPath ref="clipPath" :id="clipPathId" clipPathUnits="objectBoundingBox">
    			<path :d="clipPathData" stroke-linejoin="arcs" />
    		</clipPath>
    	</defs>
    </svg>

    <div
      :class="['slot-wrapper', { 'no-clip-path': !clipPathData || !clipPath }]"
      :style="{ 'clip-path': `url(#${clipPathId})` }">
      <slot></slot>
    </div>

  </div>
</template>

<script>
// ====================================================================== Import
import { mapGetters, mapActions } from 'vuex'

import Editor from '@/components/thingies/editor'

// ====================================================================== Export
export default {
  name: 'Thingie',

  components: {
    Editor
  },

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
      editor: false,
      clipPathId: ''
    }
  },

  computed: {
    ...mapGetters({
      landing: 'general/landing',
      authenticated: 'general/authenticated',
      zindices: 'collections/zindices'
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
    consistencies () {
      return this.thingie.consistencies
    },
    styles () {
      const styles = {
        left: this.position.x + 'px',
        top: this.position.y + 'px',
        'z-index': this.position.z,
        width: this.width + 'px',
        height: this.height + 'px',
        transform: `rotate(${this.rotate}deg)`
      }
      if (this.type === 'text') {
        styles.height = 'unset'
        styles['--thingie-font-size'] = `${this.thingie.fontsize}px`
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
    }
  },

  mounted () {
    if (this.clipPathData) {
      this.clipPathId = `clippath-${this.consistencies.join('-').replaceAll(' ', '-')}-${this.thingie.createdAt}`
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
        this.editor = !this.editor
      }
    },
    closeEditor () {
      if (this.editor) {
        this.editor = false
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
    rotateThingie (direction) {
      const delta = direction === 'cw' ? -1 : 1
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
    }
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
  }
  img,
  svg {
    pointer-events: none;
  }
  &.locked {
    pointer-events: none;
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

.clip-path-svg {
  position: absolute;
  width: 100%;
  height: 100%;
}

.slot-wrapper {
  display: block;
  pointer-events: none;
  width: 100%;
  height: 100%;
  overflow: hidden;
  &.no-clip-path {
    clip-path: none !important;
  }
}

</style>
