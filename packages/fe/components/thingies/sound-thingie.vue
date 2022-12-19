<template>
  <svg
    v-if="path"
    class="clip-path-svg"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 200 200">
    <defs>
      <path :d="path" stroke-linejoin="arcs" />
    </defs>
  </svg>
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
    }
  }
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
</style>
