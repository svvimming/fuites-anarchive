<template>
  <div
    class="radial-slider"
    :style="{ width: `${radius * 2}px`, height: `${radius * 2}px` }">

    <div ref="track" class="track">
      <div class="thumb" :style="thumbStyles"></div>
    </div>

  </div>
</template>

<script setup>
// ====================================================================== Import
import { useMouseInElement } from '@vueuse/core'
import { useMousePressed } from '@vueuse/core'

// ======================================================================= Setup
const props = defineProps({
  mode: {
    type: String,
    required: false,
    default: 'absolute'
  },
  radius: {
    type: Number,
    required: false,
    default: 46
  }
})
const emit = defineEmits(['degree-change', 'add-delta'])

// ======================================================================== Data
const track = ref(null)
const { elementX, elementY, isOutside } = useMouseInElement(track)
const { pressed } = useMousePressed({ target: track })
const theta = ref(0)
const delta = ref(0)

// ==================================================================== Computed
const thumbStyles = computed(() => ({
  left: `${props.radius - 3 + ((props.radius - 1.5) * Math.cos(theta.value))}px`,
  top: `${props.radius - 3 + ((props.radius - 1.5) * Math.sin(theta.value))}px`
}))

// ==================================================================== Watchers
watch([elementX, elementY], () => {
  if (pressed.value && !isOutside.value) {
    const rads = Math.atan2((elementY.value - props.radius), (elementX.value - props.radius))
    delta.value = rads - theta.value
    theta.value = rads
    if (props.mode === 'relative') {
      if (Math.abs(delta.value) < 0.5) { emit('add-delta', delta.value) }
    } else {
      emit('degree-change', theta.value * (180 / Math.PI))
    }
  }
})

// ===================================================================== Methods
const setTheta = val => { theta.value = val }

// ====================================================================== Expose
defineExpose({ setTheta })

</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.radial-slider {
  position: relative;
}

.track {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 100%;
  height: 100%;
  transform: translate(-50%, -50%);
  border: solid torem(3) $texasRose;
  border-radius: 50%;
}

.thumb {
  position: absolute;
  width: torem(18);
  height: torem(18);
  background-color: white;
  border: solid torem(3) $stormGray;
  border-radius: 50%;
  transform: translate(-50%, -50%);
}
</style>
