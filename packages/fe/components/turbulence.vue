<template>
  <div class="turbulence">
    <svg class="svg" width="250" height="250">
      <filter :id="instanceId" x="0%" y="0%" width="100%" height="100%">
        <feTurbulence :baseFrequency="`${freqX} ${freqY}`" result="NOISE" /> 
      </filter>
      <rect x="0" y="0" width="100%" height="100%" :filter="`url(#${instanceId})`"></rect>
    </svg>
  </div>
</template>

<script setup>
const props = defineProps({
  instanceId: {
    type: String,
    required: true
  },
  baseX: {
    type: Number,
    required: false,
    default: 0.0045
  },
  baseY: {
    type: Number,
    required: false,
    default: 0.004
  }
})
// ======================================================================== Data
const freqX = ref(0.01)
const freqY = ref(0.01)
const inc = ref(0)
const requestId = ref(false)

// ===================================================================== Methods
const animate = () => {
  freqX.value = Math.sin(Math.PI * 0.38 * inc.value) * 0.00025 + props.baseX
  freqY.value = Math.sin(Math.PI * 0.35 * inc.value - 1) * 0.0003 + props.baseY
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

.svg {
  width: 100%;
  height: 100%;
}
</style>
