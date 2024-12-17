<template>
  <svg
    v-if="boundingElement"
    class="svg-border-rectangle"
    :width="width"
    :height="height"
    :viewBox="`0 0 ${width} ${height}`"
    fill="none"
    xmlns="http://www.w3.org/2000/svg">
    <rect
      x="1"
      y="1"
      rx="19"
      :width="Math.abs(width - 2)"
      :height="Math.abs(height - 2)"
      stroke-width="2"
      stroke-dasharray="2 4 6 8 2.5 2 4 1.5" />
  </svg>
</template>

<script setup>
// ====================================================================== Import
import { useElementBounding } from '@vueuse/core'

// ======================================================================= Props
const props = defineProps({
  inheritFrom: {
    type: [Object, null],
    required: true
  }
})

const emit = defineEmits(['loaded'])

// ======================================================================== Data
const boundingElement = ref(null)
const { width, height } = useElementBounding(boundingElement)

// ==================================================================== Watchers
watch([width, height], (dimensions) => {
  if (dimensions[0] && dimensions[1]) {
    emit('loaded')
  }
})

// ======================================================================= Hooks
onMounted(() => {
  nextTick(() => {
    boundingElement.value = props.inheritFrom
  })
})
</script>

<style lang="scss" scoped>
.svg-border-rectangle {
  position: absolute;
  right: 0;
  top: 0;
}
</style>
