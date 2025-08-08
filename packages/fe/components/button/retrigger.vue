<template>
  <button
    class="retrigger-button"
    @mousedown="handleMouseDown"
    @mouseup="handleMouseUp"
    @mouseleave="handleMouseUp">

    <slot/>

  </button>
</template>

<script setup>
// ======================================================================= Setup
const emit = defineEmits(['retrigger'])

// ======================================================================== Data
const buffer = ref(0)
const intervalId = ref(false)

// ===================================================================== Methods
const handleMouseDown = () => {
  emit('retrigger')
  buffer.value = 0
  intervalId.value = setInterval(retrigger, 50)
}

const handleMouseUp = () => {
  clearInterval(intervalId.value)
  buffer.value = 0
}

const retrigger = () => {
  if (buffer.value > 9) {
    emit('retrigger')
  }
  buffer.value++
}
</script>
