<template>
  <div
    class="sound-thingie"
    :style="styles">

    <audio
      ref="audioElement"
      crossorigin="anonymous"
      :loop="true">
    </audio>

    <svg
      v-if="processedPathData"
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
    touchEnabled: {
      type: Boolean,
      required: false,
      default: false
    },
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
    gain: {
      type: Number,
      required: false,
      default: 1
    },
    path: {
      type: String,
      required: true,
      default: ''
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
    },
    css: {
      type: [Boolean, Array],
      required: false,
      default: false
    }
  },

  data () {
    return {
      mousemove: false,
      source: false,
      player: false,
      gainNode: false,
      amplitude: 0
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
      if (this.points.length) {
        const svgPath = this.$simplifySvgPath(this.points)
        return svgPath
      }
      return false
    },
    limitStrokeWidth () {
      if (this.strokeWidth < 1) { return -1 / (this.strokeWidth - 1) }
      return this.strokeWidth
    },
    opacity () {
      return this.playState === 'running' ? 0.4 + (this.amplitude * 0.6) : 0.4
    },
    styles () {
      const styles = {
        '--path-stroke-color': this.colors[0] ? this.colors[0] : '#6c6575',
        '--path-opacity': `${this.opacity}`,
        '--path-stroke-width': this.limitStrokeWidth
      }
      if (Array.isArray(this.css)) {
        this.css.forEach((line) => {
          const props = line.split(':')
          const key = props[0]
          const value = props[1]
          styles[key] = value
        })
      }
      return styles
    }
  },

  watch: {
    audioContext (val) {
      if (val) {
        this.initSoundThingie()
      }
    },
    gain () {
      if (this.gainNode) {
        this.gainNode.gain.value = this.amplitude * this.gain
      }
    }
  },

  mounted () {
    if (this.audioContext) {
      this.initSoundThingie()
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
        this.player.src = `${this.$config.backendUrl}/${this.$config.mongoInstance}/${this.audio}.${this.filetype}`
        this.source = this.audioContext.createMediaElementSource(this.player)
        this.gainNode = this.audioContext.createGain()
        this.gainNode.gain.value = 0
        this.source.connect(this.gainNode).connect(this.audioContext.destination)
        this.addSoundThingieListeners()
        this.player.play()
      }
    },
    addSoundThingieListeners () {
      this.mousemove = Throttle((e) => { calculateMouseDistance(e, this) }, 100)
      window.addEventListener('mousemove', (e) => { this.mousemove(e) })
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
}

</style>
