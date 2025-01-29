<template>
  <div
    class="radial-slider-bounded"
    :style="{ width: `${radius * 2}px`, height: `${radius * 2}px` }">

    <slot :theta="theta"></slot>

    <div
      ref="track"
      class="track"
      :style="thumbBounds">
      <div class="cover"></div>
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
  radius: {
    type: Number,
    required: false,
    default: 46
  },
  inputRange: {
    type: Array,
    required: false,
    default: () => [0, 360]
  },
  outputRange: {
    type: Array, 
    required: false,
    default: () => [0, 360]
  },
  includeThumbBounds: {
    type: Boolean,
    required: false,
    default: false
  }
})
const emit = defineEmits(['degree-change'])

// ======================================================================== Data
const track = ref(null)
const { elementX, elementY, isOutside } = useMouseInElement(track)
const { pressed } = useMousePressed({ target: track })
const theta = ref(0)
const thumbBounds = ref({})

// ==================================================================== Computed
const lowerBound = computed(() => props.inputRange[0] * (Math.PI / 180) - Math.PI)
const upperBound = computed(() => props.inputRange[1] * (Math.PI / 180) - Math.PI)
const thumbStyles = computed(() => ({
  left: `${props.radius - 3 + ((props.radius - 1.5) * -1 * Math.cos(theta.value + Math.PI / 2))}px`,
  top: `${props.radius - 3 + ((props.radius - 1.5) * -1 * Math.sin(theta.value + Math.PI / 2))}px`
}))

// ==================================================================== Watchers
watch([elementX, elementY], () => {
  if (pressed.value && !isOutside.value) {
    const rads = Math.atan2((elementX.value - props.radius), -1 * (elementY.value - props.radius))
    if (lowerBound.value <= rads && rads <= upperBound.value) {
      theta.value = rads
      const output = ((theta.value - lowerBound.value) * (props.outputRange[1] - props.outputRange[0]) / (upperBound.value - lowerBound.value)) + props.outputRange[0]
      emit('degree-change', output)
    }
  }
})

onMounted(() => {
  if (props.includeThumbBounds) {
    thumbBounds.value = {
      '--upper-bound-left': `${props.radius - 3 + ((props.radius - 1.5) * -1 * Math.cos(upperBound.value + Math.PI / 2))}px`,
      '--upper-bound-top': `${props.radius - 3 + ((props.radius - 1.5) * -1 * Math.sin(upperBound.value + Math.PI / 2))}px`,
      '--lower-bound-left': `${props.radius - 3 + ((props.radius - 1.5) * -1 * Math.cos(lowerBound.value + Math.PI / 2))}px`,
      '--lower-bound-top': `${props.radius - 3 + ((props.radius - 1.5) * -1 * Math.sin(lowerBound.value + Math.PI / 2))}px`
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
.radial-slider-bounded {
  position: relative;
}

.track {
  --upper-bound-left: -999px;
  --upper-bound-top: -999px;
  --lower-bound-left: -999px;
  --lower-bound-top: -999px;
  position: absolute;
  left: 50%;
  top: 50%;
  width: 100%;
  height: 100%;
  transform: translate(-50%, -50%);
  border: solid torem(3) $texasRose;
  border-radius: 50%;
  &:before,
  &:after {
    content:  '';
    position: absolute;
    width: torem(12);
    height: torem(12);
    border: solid torem(2) $texasRose;
    border-radius: 50%;
    z-index: 3;
    transform: translate(-50%, -50%);
  }
  &:before {
    background-color: $texasRose;
    left: var(--upper-bound-left);
    top: var(--upper-bound-top);
  }
  &:after {
    background-color: $stormGray;
    left: var(--lower-bound-left);
    top: var(--lower-bound-top);
  } 
}

.cover {
  position: absolute;
  width: 6px;
  top: -4px;
  left: calc(50% - 10px);
  height: calc(100% + 8px);
  background-color: $stormGray;
  z-index: 2;
}

.thumb {
  position: absolute;
  width: torem(18);
  height: torem(18);
  background-color: white;
  border: solid torem(3) $stormGray;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  z-index: 4;
}
</style>
