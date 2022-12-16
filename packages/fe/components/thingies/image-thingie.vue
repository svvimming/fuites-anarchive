<template>
  <div
    :class="['image-thingie', { 'no-clip-path': !clipPath || !clip }]"
    :style="{ 'clip-path': `url(#${pathId})` }">

    <svg
      v-if="clip && clipPath"
      class="clip-path-svg"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200">
      <defs>
        <clipPath :id="pathId" clipPathUnits="objectBoundingBox">
          <path :d="clipPath" stroke-linejoin="arcs" />
        </clipPath>
      </defs>
    </svg>

    <img :src="`${$config.backendUrl}/${image}.${filetype}`" />

  </div>
</template>

<script>
// ====================================================================== Export
export default {
  name: 'ImageThingie',

  props: {
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
    }
  },

  data () {
    return {
      pathId: ''
    }
  },

  mounted () {
    if (this.clip) {
      this.pathId = `clippath-${Math.random()}-${Math.random()}`
    }
  }
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.image-thingie {
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
