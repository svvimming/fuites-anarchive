<template>
  <div
    class="radial-slider-bounded"
    :style="{ width: `${radius * 2}px`, height: `${radius * 2}px`, '--thumb-width': `${radius * 0.39}px` }">

    <slot :theta="theta"></slot>

    <div
      ref="track"
      class="track"
      :style="trackStyles">

      <SvgCaddyBoundedRadialSlider v-if="includeTrackStyles" class="svg-track" />

      <div class="thumb" :style="thumbStyles">
        <SvgRadialSliderThumb class="thumb-icon" />
      </div>

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
  includeTrackStyles: {
    type: Boolean,
    required: false,
    default: false
  }
})
const emit = defineEmits(['degree-change'])

// ======================================================================== Data
const track = ref(null)
const { elementX, elementY } = useMouseInElement(track)
const { pressed } = useMousePressed({ target: track })
const theta = ref(0)
const trackStyles = ref({})
const borderWidth = 5

// ==================================================================== Computed
const lowerBound = computed(() => props.inputRange[0] * (Math.PI / 180) - Math.PI)
const upperBound = computed(() => props.inputRange[1] * (Math.PI / 180) - Math.PI)
const thumbStyles = computed(() => ({
  left: `${props.radius - borderWidth + ((props.radius - (borderWidth / 2)) * -1 * Math.cos(theta.value + Math.PI / 2))}px`,
  top: `${props.radius - borderWidth + ((props.radius - (borderWidth / 2)) * -1 * Math.sin(theta.value + Math.PI / 2))}px`
}))

// ==================================================================== Watchers
watch([elementX, elementY], () => {
  if (pressed.value) {
    const rads = Math.atan2((elementX.value - props.radius), -1 * (elementY.value - props.radius))
    if (lowerBound.value <= rads && rads <= upperBound.value) {
      theta.value = rads
      const output = ((theta.value - lowerBound.value) * (props.outputRange[1] - props.outputRange[0]) / (upperBound.value - lowerBound.value)) + props.outputRange[0]
      emit('degree-change', output)
    }
  }
})

onMounted(() => {
  if (props.includeTrackStyles) {
    trackStyles.value = {
      '--border-stroke-width': `${borderWidth}px`,
      '--upper-bound-left': `${props.radius - borderWidth + ((props.radius - (borderWidth / 2)) * -1 * Math.cos(upperBound.value + Math.PI / 2))}px`,
      '--upper-bound-top': `${props.radius - borderWidth + ((props.radius - (borderWidth / 2)) * -1 * Math.sin(upperBound.value + Math.PI / 2))}px`,
      '--lower-bound-left': `${props.radius - borderWidth + ((props.radius - (borderWidth / 2)) * -1 * Math.cos(lowerBound.value + Math.PI / 2))}px`,
      '--lower-bound-top': `${props.radius - borderWidth + ((props.radius - (borderWidth / 2)) * -1 * Math.sin(lowerBound.value + Math.PI / 2))}px`
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
  --thumb-width: torem(18);
  position: relative;
  .thumb {
    width: var(--thumb-width);
    height: var(--thumb-width);
  }
}

.track {
  --upper-bound-left: -999px;
  --upper-bound-top: -999px;
  --lower-bound-left: -999px;
  --lower-bound-top: -999px;
  --border-stroke-width: torem(5);
  position: absolute;
  left: 50%;
  top: 50%;
  width: 100%;
  height: 100%;
  transform: translate(-50%, -50%);
  border: solid var(--border-stroke-width) transparent;
  border-radius: 50%;
  .svg-track {
    position: absolute;
    top: calc(var(--border-stroke-width) * -1 - torem(4));
    left: calc(var(--border-stroke-width) * -2 + torem(4));
    width: calc(46% + (var(--border-stroke-width) * 2));
    height: calc(101% + (var(--border-stroke-width) * 2) + torem(8));
  }
  &:hover {
    cursor: pointer;
  }
}

.thumb {
  position: absolute;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: transform 150ms ease;
  z-index: 100;
  &:hover {
    transform: translate(-50%, -50%) scale(1.1);
  }
  .thumb-icon {
    position: absolute;
    width: 100%;
    height: 100%;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
  }
}
</style>
