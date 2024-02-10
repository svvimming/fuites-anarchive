<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="100%"
    height="100%"
    class="turbulence-bg">

    <filter id="filter">

      <feTurbulence
        result="1"
        x="0"
        y="0%"
        width="100%"
        height="100%"
        :baseFrequency="freq" />

      <feMerge>
        <feMergeNode in="1" />
      </feMerge>

    </filter>

    <rect
      width="100%"
      height="100%"
      filter="url(#filter)" />

  </svg>
</template>

<script>
// ====================================================================== Export
export default {
  name: 'Irridescence',

  props: {
    freq: {
      type: Number,
      required: false,
      default: 0.01
    }
  }
}
</script>

<style>
</style>
