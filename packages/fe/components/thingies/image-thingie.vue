<template>
  <div
    class="image-thingie"
    :style="thingieStyles">

    <div
      :class="['image-wrapper', { 'no-clip-path': !clipPath || !clip }]"
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

      <img :src="`${$config.backendUrl}/${image}.${filetype}`" />

    </div>

  </div>
</template>

<script>
// ====================================================================== Export
export default {
  name: 'ImageThingie',

  props: {
    touchEnabled: {
      type: Boolean,
      required: false,
      default: false
    },
    image: {
      type: String,
      required: true,
      default: ''
    },
    filetype: {
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
    }
  },

  data () {
    return {
      pathId: ''
    }
  },

  computed: {
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
      if (Array.isArray(this.points)) {
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

  mounted () {
    if (this.clipPath) {
      this.pathId = `clippath-${Math.random()}-${Math.random()}`
    }
  }
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.image-thingie {
  pointer-events: none;
  width: 100%;
  height: 100%;
}

.image-wrapper {
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

img {
  width: 100%;
  height: 100%;
}

</style>
