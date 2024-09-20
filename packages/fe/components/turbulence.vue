<template>
  <div class="turbulence">
    <svg width="250" height="250">
      <filter id='noise' x='0%' y='0%' width='100%' height='100%'>
        <feTurbulence :baseFrequency="`${freqX} ${freqY}`" result="NOISE" /> 
      </filter>
      <rect x="0" y="0" width="100%" height="100%" filter="url(#noise)"></rect>
    </svg>
  </div>
</template>

<script setup>
// ======================================================================== Data
const freqX = ref(0.01)
const freqY = ref(0.01)
const inc = ref(0)
const requestId = ref(false)

// ===================================================================== Methods
const animate = () => {
  freqX.value = Math.sin(Math.PI * 0.55 * inc.value) * 0.0005 + 0.0075
  freqY.value = Math.sin(Math.PI * 0.45 * inc.value - 1) * 0.0006 + 0.007
  inc.value = inc.value + 0.01
  requestId.value = requestAnimationFrame(animate)
}

// ======================================================================= Hooks
onMounted(() => { animate() })

onBeforeUnmount(() => {
  if (requestId.value) { cancelAnimationFrame(requestId.value) }
})
</script>

<style lang="scss" scoped>
.turbulence {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
</style>
