<template>
  <button :class="['caddy-button', { selected }]" @click="emit('clicked')">

    <slot></slot>

  </button>
</template>

<script setup>
// ======================================================================= Props
defineProps({
  selected: {
    type: Boolean,
    required: false,
    default: false
  }
})

const emit = defineEmits(['clicked'])
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.caddy-button {
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  transform: translate(-50%, -50%);
  &.selected {
    visibility: hidden;
    opacity: 0;
  }
}
</style>
