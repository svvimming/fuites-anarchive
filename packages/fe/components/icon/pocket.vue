<template>
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" :class="['pocket-icon',{ open: openIcon }]">
    <path
      d="M1 4.28571C1 2.47106 2.47106 1 4.28571 1H17.7143C19.5289 1 21 2.47106 21 4.28571C21 5.57947 20.2408 6.7528 19.0606 7.28293L12.639 10.1675C11.5965 10.6358 10.4035 10.6358 9.36098 10.1675L2.93937 7.28293C1.75921 6.7528 1 5.57947 1 4.28571Z"
      stroke="#8393C0"
      stroke-width="2"
      class="flap" />
    <path
      d="M1 11L1 16C1 18.7614 3.23858 21 6 21L11 21L16 21C18.7614 21 21 18.7614 21 16L21 11"
      stroke="#8393C0"
      stroke-width="2"
      stroke-linecap="round"
      class="pouch" />
  </svg>
</template>

<script setup>
// ======================================================================= Props
const props = defineProps({
  openIcon: {
    type: Boolean,
    default: false
  }
})
</script>

<style lang="scss" scoped>
.pocket-icon {
  overflow: visible;
  &.open {
    .flap {
      transform: scaleY(-1) translateY(torem(-10));
    }
    .pouch {
      transform: scaleY(0.9) translateY(torem(2.5));
    }
  }
}
</style>
