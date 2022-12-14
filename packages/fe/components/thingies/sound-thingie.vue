<template>
  <div
    class="sound-thingie"
    :style="styles">

    <div :class="['toolbar', { editor }]">
      <button
        type="button"
        class="editor-button"
        @click="$emit('change-stroke-width', 'up')">
        ˄
      </button>
      <button
        type="button"
        class="editor-button"
        @click="$emit('change-stroke-width', 'down')">
        ˅
      </button>
      <button
        v-if="audioContext"
        type="button"
        class="editor-button"
        @click="changeGain('up')">
        🔊
      </button>
      <button
        v-if="audioContext"
        type="button"
        class="editor-button"
        @click="changeGain('down')">
        🔉
      </button>
    </div>

    <audio
      ref="audioElement"
      :loop="true"
      :src="`${$config.backendUrl}/${audio}.${filetype}`">
    </audio>

    <svg
      v-if="path"
      class="svg"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200">
      <path
        :d="processedPathData"
        stroke-linejoin="arcs"
        stroke-linecap="round"
        fill="none"
        stroke-width="3" />
    </svg>

  </div>
</template>

<script>
// ====================================================================== Import
import { mapGetters, mapActions } from 'vuex'

import Throttle from 'lodash/throttle'

// =================================================================== Functions
const calculateMouseDistance = (e, instance) => {
  const pos = instance.position
  const hw = instance.width / 2
  const deltaX = pos.x + hw - e.clientX - window.scrollX
  const deltaY = pos.y + hw - e.clientY - window.scrollY
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
  const amp = Math.exp(-0.005 * distance)
  instance.gainNode.gain.value = amp * instance.gain
  instance.amplitude = amp
}

// ====================================================================== Export
export default {
  name: 'SoundThingie',

  props: {
    audio: {
      type: String,
      required: true,
      default: ''
    },
    filetype: {
      type: String,
      required: true,
      default: ''
    },
    lastGain: {
      type: Number,
      required: false,
      default: 1
    },
    path: {
      type: String,
      required: true,
      default: ''
    },
    editor: {
      type: Boolean,
      required: false,
      default: false
    },
    colors: {
      type: Array,
      required: false,
      default: () => []
    },
    position: {
      type: Object,
      required: true,
      default: () => ({
        x: 0, y: 0
      })
    },
    width: {
      type: Number,
      required: true,
      default: 80
    },
    strokeWidth: {
      type: Number,
      required: false,
      default: 3
    }
  },

  data () {
    return {
      mousemove: false,
      source: false,
      player: false,
      gainNode: false,
      amplitude: 0,
      gain: 1
    }
  },

  computed: {
    ...mapGetters({
      audioContext: 'mixer/audioContext',
      playState: 'mixer/playState'
    }),
    points () {
      const path = this.path.split(' ')
      const len = path.length
      const points = []
      for (let i = 0; i < len - 1; i += 2) {
        points.push([parseInt(path[i]), parseInt(path[i + 1])])
      }
      return points
    },
    processedPathData () {
      const svgPath = this.$simplifySvgPath(this.points)
      return svgPath
    },
    limitStrokeWidth () {
      if (this.strokeWidth < 1) { return -1 / (this.strokeWidth - 1) }
      return this.strokeWidth
    },
    opacity () {
      return this.playState === 'running' ? 0.4 + (this.amplitude * 0.6) : 0.4
    },
    styles () {
      return {
        '--path-stroke-color': this.colors[0] ? this.colors[0] : '#6c6575',
        '--path-opacity': `${this.opacity}`,
        '--path-stroke-width': this.limitStrokeWidth
      }
    }
  },

  watch: {
    audioContext (val) {
      if (val) {
        this.initSoundThingie()
      }
    },
    gain () {
      this.gainNode.gain.value = this.amplitude * this.gain
      this.$emit('change-sound-level', this.gain)
    }
  },

  beforeDestroy () {
    if (this.player) { this.player.pause() }
    if (this.mousemove) { window.removeEventListener('mousemove', this.mousemove) }
  },

  methods: {
    initSoundThingie () {
      if (this.$refs.audioElement) {
        this.player = this.$refs.audioElement
        this.player.crossOrigin = 'anonymous'
        this.source = this.audioContext.createMediaElementSource(this.player)
        this.gainNode = this.audioContext.createGain()
        this.gainNode.gain.value = 0
        this.gain = this.lastGain
        this.source.connect(this.gainNode).connect(this.audioContext.destination)
        this.addSoundThingieListeners()
        this.player.play()
      }
    },
    addSoundThingieListeners () {
      this.mousemove = Throttle((e) => { calculateMouseDistance(e, this) }, 100)
      window.addEventListener('mousemove', (e) => { this.mousemove(e) })
    },
    changeGain (val) {
      if (val === 'up') {
        this.gain = Math.min(this.gain + 0.1, 3.0)
      }
      if (val === 'down') {
        this.gain = Math.max(this.gain - 0.1, 0.1)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.sound-thingie {
  --path-stroke-color: #6c6575;
  --path-opacity: 0;
  --path-stroke-width: 3;
  width: 100%;
  height: 100%;
  pointer-events: none;
  .svg {
    pointer-events: none;
    overflow: visible;
    width: 100%;
    height: 100%;
    opacity: var(--path-opacity);
    path {
      stroke: var(--path-stroke-color);
      stroke-width: var(--path-stroke-width);
    }
  }
  .editor-button {
    color: var(--path-stroke-color);
  }
}

.toolbar {
  display: none;
  flex-direction: column;
  justify-content: flex-start;
  width: 1.25rem;
  height: 100%;
  position: absolute;
  pointer-events: auto;
  left: calc(100% + 1.75rem);
  top: 0;
  &.editor {
    display: flex;
  }
}

.editor-button {
  pointer-events: auto;
  padding: 0.25rem;
  line-height: 1;
  text-align: center;
}

</style>
