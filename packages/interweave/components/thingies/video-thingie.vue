<template>
  <div
    class="video-thingie"
    :style="thingieStyles">

    <div
      :class="['video-wrapper', { 'no-clip-path': !clipPath || !clip }]"
      :style="{ 'clip-path': `url(#${pathId})` }">

      <svg
        v-if="clip && clipPath"
        class="clip-path-svg"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 200 200">
        <defs>
          <clipPath :id="pathId" clipPathUnits="objectBoundingBox">
            <path :d="svgPath" stroke-linejoin="arcs" />
          </clipPath>
        </defs>
      </svg>

      <video
        ref="videoElement"
        crossorigin="anonymous"
        :loop="true">
        <source
          :src="`${$config.backendUrl}/${$config.mongoInstance}/${video}.${filetype}`"
          :type="mimetype" />
      </video>

    </div>

  </div>
</template>

<script>
// ====================================================================== Import
import { mapGetters } from 'vuex'

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
  name: 'VideoThingie',

  props: {
    touchEnabled: {
      type: Boolean,
      required: false,
      default: false
    },
    video: {
      type: String,
      required: true,
      default: ''
    },
    filetype: {
      type: String,
      required: true,
      default: ''
    },
    mimetype: {
      type: String,
      required: true,
      default: ''
    },
    clip: {
      type: Boolean,
      required: false,
      default: false
    },
    clipPath: {
      type: String,
      required: false,
      default: ''
    },
    css: {
      type: [Boolean, Array],
      required: false,
      default: false
    },
    gain: {
      type: Number,
      required: false,
      default: 1
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
    }
  },

  data () {
    return {
      pathId: '',
      mousemove: false,
      source: false,
      videoPlayer: false,
      gainNode: false,
      amplitude: 0
    }
  },

  computed: {
    ...mapGetters({
      videoPlaying: 'general/videoPlaying',
      audioContext: 'mixer/audioContext',
      playState: 'mixer/playState'
    }),
    points () {
      if (!this.clipPath.startsWith('M')) {
        const path = this.clipPath.split(' ').map(num => parseInt(num) / 200)
        const len = path.length
        const points = []
        for (let i = 0; i < len - 1; i += 2) {
          points.push([path[i], path[i + 1]])
        }
        return points
      }
      return false
    },
    svgPath () {
      if (Array.isArray(this.points) && this.points.length) {
        const svgPath = this.$simplifySvgPath(this.points, { tolerance: 0.001 })
        return svgPath + ' Z'
      }
      return this.clipPath
    },
    thingieStyles () {
      if (Array.isArray(this.css)) {
        const styles = {}
        this.css.forEach((line) => {
          const props = line.split(':')
          const key = props[0]
          const value = props[1]
          styles[key] = value
        })
        return styles
      }
      return false
    }
  },

  watch: {
    videoPlaying(val) {
      if (this.audioContext && this.playState === 'running') {
        this.$refs.videoElement.muted = false
      } else {
        this.$refs.videoElement.muted = true
      }
      if (val) {
        this.$refs.videoElement.play()
      } else {
        this.$refs.videoElement.pause()
      }
    },
    audioContext (val) {
      if (val) {
        this.initVideoThingie()
      }
    },
    gain () {
      if (this.gainNode) {
        this.gainNode.gain.value = this.amplitude * this.gain
      }
    }
  },

  mounted () {
    if (this.clipPath) {
      this.pathId = `clippath-${Math.random()}-${Math.random()}`
    }
    if (this.audioContext) {
      this.initVideoThingie()
    }
  },

  beforeDestroy () {
    if (this.videoPlayer) { this.videoPlayer.pause() }
    if (this.mousemove) { window.removeEventListener('mousemove', this.mousemove) }
  },

  methods: {
    initVideoThingie () {
      if (this.$refs.videoElement) {
        this.videoPlayer = this.$refs.videoElement
        this.videoPlayer.crossOrigin = 'anonymous'
        this.source = this.audioContext.createMediaElementSource(this.videoPlayer)
        this.gainNode = this.audioContext.createGain()
        this.gainNode.gain.value = 0
        this.source.connect(this.gainNode).connect(this.audioContext.destination)
        this.addVideoThingieListeners()
      }
    },
    addVideoThingieListeners () {
      this.mousemove = Throttle((e) => { calculateMouseDistance(e, this) }, 100)
      window.addEventListener('mousemove', (e) => { this.mousemove(e) })
    }
  }
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.video-thingie {
  pointer-events: none;
  width: 100%;
  height: 100%;
}

.video-wrapper {
  display: block;
  pointer-events: none;
  width: 100%;
  height: 100%;
  overflow: hidden;
  &.no-clip-path {
    clip-path: none !important;
  }
}

.clip-path-svg {
  position: absolute;
  width: 100%;
  height: 100%;
}

video {
  width: 100%;
  height: 100%;
}

</style>
