<template>
  <div class="image-thingie">

    <button
      v-if="clipPath"
      type="button"
      :class="['editor-button', 'clip-toggle-button', { editor }]"
      @click="$emit('toggle-clip-path', !clip)">
      <span>*</span>
    </button>
    <button
      type="button"
      :class="['editor-button', 'opacity-control', { editor }]"
      @click="$emit('change-opacity')">
      o
    </button>

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
    editor: {
      type: Boolean,
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

.clip-toggle-button,
.opacity-control {
  position: absolute;
  display: none;
  pointer-events: auto;
  padding: 0.25rem;
  line-height: 1;
  text-align: center;
  left: calc(100% + 1.75rem);
  &.editor {
    display: block;
  }
}

.clip-toggle-button {
  top: -0.5rem;
  span {
    display: block;
    transform: translateY(0.25rem);
  }
}

.opacity-control {
  top: 1rem;
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
