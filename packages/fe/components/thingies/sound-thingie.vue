<template>
  <div
    class="sound-thingie"
    :style="styles">

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
// ====================================================================== Export
export default {
  name: 'SoundThingie',

  props: {
    path: {
      type: String,
      required: true,
      default: ''
    },
    colors: {
      type: Array,
      required: false,
      default: () => []
    }
  },

  computed: {
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
  }
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.sound-thingie {
  --path-stroke-color: #6c6575;
  width: 100%;
  height: 100%;
  pointer-events: none;
  .svg {
    pointer-events: none;
    width: 100%;
    height: 100%;
    path {
      stroke: var(--path-stroke-color);
    }
  }
}

</style>
