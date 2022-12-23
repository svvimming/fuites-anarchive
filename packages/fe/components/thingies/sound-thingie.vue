<template>
  <div
    class="sound-thingie"
    :style="styles">

    <audio
      ref="audioElement"
      :loop="true"
      src="/a-s-fridge.mp3">
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
// :src="`${$config.backendUrl}/${audio}.${filetype}`"

// =================================================================== Functions
const calculateMouseDistance = (e, instance) => {
  const pos = instance.position
  const deltaX = pos.x - e.clientX
  const deltaY = pos.y - e.clientY
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
  const gain = Math.exp(-0.005 * distance)
  instance.gainNode.gain.value = gain
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
    }
  },

  data () {
    return {
      mousemove: false,
      source: false,
      player: false,
      gainNode: false
    }
  },

  computed: {
    ...mapGetters({
      audioContext: 'mixer/audioContext'
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
    styles () {
      return {
        '--path-stroke-color': this.colors[0] ? this.colors[0] : '#6c6575'
      }
    }
  },

  watch: {
    audioContext (val) {
      if (val) {
        this.initSoundThingie()
      }
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
        // this.player.crossOrigin = 'anonymous'
        this.source = this.audioContext.createMediaElementSource(this.player)
        this.gainNode = this.audioContext.createGain()
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
  --shadow-radius: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  .svg {
    pointer-events: none;
    width: 100%;
    height: 100%;
    // filter: drop-shadow(0 0 var(--shadow-radius) var(--path-stroke-color));
    path {
      stroke: var(--path-stroke-color);
    }
  }
}

</style>
