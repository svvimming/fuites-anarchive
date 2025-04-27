<template>
  <v-line
    v-if="config"
    :key="path.join(',')"
    :config="config" />
</template>

<script setup>
// ======================================================================== Data
const mixerStore = useMixerStore()
const { recording } = storeToRefs(mixerStore)

// ==================================================================== Computed
const path = computed(() => recording.value.path)
const config = computed(() => {
  if (!path.value.length) return null
  return {
    points: path.value,
    stroke: '#000000',
    strokeWidth: 2,
    lineCap: 'round',
    lineJoin: 'round'
  }
})
</script>
