<template>
  <div
    class="radial-slider-infinite"
    :style="{ width: `${radius * 2}px`, height: `${radius * 2}px` }">

    <div
      ref="track"
      class="track"
      :style="{ '--border-stroke-width': `${borderWidth}px` }">
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
const { elementX, elementY } = useMouseInElement(track)
const { pressed } = useMousePressed({ target: track })
const theta = ref(0)
const delta = ref(0)
const borderWidth = 5

// ==================================================================== Computed
const thumbStyles = computed(() => ({
  left: `${props.radius - borderWidth + ((props.radius - (borderWidth / 2)) * Math.cos(theta.value))}px`,
  top: `${props.radius - borderWidth + ((props.radius - (borderWidth / 2)) * Math.sin(theta.value))}px`
}))

// ==================================================================== Watchers
watch([elementX, elementY], () => {
  if (pressed.value) {
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
.radial-slider-infinite {
  position: relative;
}

.track {
  --border-stroke-width: torem(5);
  position: absolute;
  left: 50%;
  top: 50%;
  width: 100%;
  height: 100%;
  transform: translate(-50%, -50%);
  border: var(--border-stroke-width) solid #40434D;
  box-shadow: inset 0.5px 0.5px 1px rgba(0, 0, 0, 0.25);
  filter: drop-shadow(-0.5px -0.5px 1px rgba(69, 73, 86, 0.8)) drop-shadow(0.5px 0.5px 1px #949DB8);
  border-radius: 50%;
  &:before {
    content: '';
    position: absolute;
    left: calc(var(--border-stroke-width) * -1);
    top: calc(var(--border-stroke-width) * -1);
    width: calc(100% + (var(--border-stroke-width) * 2));
    height: calc(100% + (var(--border-stroke-width) * 2));
    border-radius: 50%;
    box-shadow: inset 0.5px 0.5px 1px rgba(0, 0, 0, 0.5);
    z-index: 1;
  }
  &:after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    box-shadow: 0.5px 0.5px 1px rgba(0, 0, 0, 0.5);
    z-index: 1;
  }
  &:hover {
    cursor: pointer;
  }
}

.thumb {
  position: absolute;
  width: torem(18);
  height: torem(18);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: transform 150ms ease;
  z-index: 100;
  &:hover {
    transform: translate(-50%, -50%) scale(1.1);
  }
  .thumb-icon {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
  }
}
</style>
