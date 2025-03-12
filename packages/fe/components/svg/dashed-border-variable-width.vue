<template>
  <svg
    :width="width + 2"
    height="42"
    :viewBox="`0 0 ${width + 2} 42`"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    class="svg">
    <rect
      x="1"
      y="1"
      :width="width"
      height="40"
      rx="20"
      stroke="#8393C0"
      stroke-width="2"
      stroke-linecap="round"
      class="rect" />
  </svg>
</template>

<script setup>
// ======================================================================== Data
defineProps({
  width: {
    type: Number,
    required: false,
    default: 5
  }
})
</script>
