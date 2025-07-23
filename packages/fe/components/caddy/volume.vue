<template>
  <div class="volume-tool" :style="{ '--parent-radius': `${parentRadius}px` }">
    
    <div class="meter">
      <IconAudioMeter
        class="audio-meter-svg"
        :style="{ '--needle-angle': `${(mixerLevel * 120 / 100) - 60}deg` }" />
    </div>

    <div class="volume-knob">
      <RadialSliderBounded
        ref="volumeSliderRef"
        v-slot="{ theta }"
        :radius="parentRadius * 0.484"
        :input-range="[57, 303]"
        :output-range="[0, 1]"
        @degree-change="handleVolumeChange">
        <IconKnob class="knob" />
        <div
          class="notch"
          :style="{ transform: `rotate(${theta * (180 / Math.PI)}deg)` }">
        </div>
      </RadialSliderBounded>
    </div>

    <div class="step-controls">
      <ButtonRetrigger
        class="size-button"
        @retrigger="handleIncrementVolume(-1)">
        <IconCaddyArcLeft />
        <span class="label">-</span>
      </ButtonRetrigger>
      <div
        class="size-button">
        <IconCaddyArcMiddle />
        <input
          v-model="knobLevel"
          type="number"
          pattern="[0-9]*"
          class="input" />
      </div>
      <ButtonRetrigger
        class="size-button"
        @retrigger="handleIncrementVolume(1)">
        <IconCaddyArcRight />
        <span class="label">+</span>
      </ButtonRetrigger>
    </div>

  </div>
</template>

<script setup>
// ======================================================================= Setup
const props = defineProps({
  active: {
    type: Boolean,
    required: false,
    default: false
  },
  parentRadius: {
    type: Number,
    required: false,
    default: 66
  }
})
const emit = defineEmits(['update-gain'])

// ======================================================================== Data
const collectorStore = useCollectorStore()
const { thingies, editing } = storeToRefs(collectorStore)
const mixerStore = useMixerStore()
const { audioContext, analyser } = storeToRefs(mixerStore)

const audioBufferArray = ref(false)
const requestId = ref(false)
const mixerLevel = ref(0)
const volumeSliderRef = ref(null)
const knobLevel = ref(0)

// ==================================================================== Computed
const thingie = computed(() => thingies.value.data.find(item => item._id === editing.value))

// ==================================================================== Watchers
watch(editing, () => {
  if (volumeSliderRef.value && thingie.value?.thingie_type === 'sound') {
    const defaultDegree = (thingie.value.gain * (303 - 57)) + 57 // map gain to degree range of knob
    volumeSliderRef.value.setTheta(defaultDegree * (Math.PI / 180) - Math.PI)
    knobLevel.value = Math.round(thingie.value.gain * 10)
  }
})

watch(audioContext, (val) => {
  if (val) {
    nextTick(() => {
      initAudioBufferArray()
    })
  }
})

watch(() => props.active, (val) => {
  if (val && analyser.value && audioBufferArray.value) {
    calculateOutputLevel()
  } else if (requestId.value) {
    cancelAnimationFrame(requestId.value)
  }
})

// ===================================================================== Methods
/**
 * @method handleVolumeChange
 */

const handleVolumeChange = val => {
  knobLevel.value = Math.round(val * 10)
  emit('update-gain', val)
}

/**
 * @method handleIncrementVolume
 */

const handleIncrementVolume = val => {
  knobLevel.value = Math.max(0, Math.min(knobLevel.value + val, 10))
  const degree = ((knobLevel.value / 10) * (303 - 57)) + 57 // map level to degree range of knob
  volumeSliderRef.value.setTheta(degree * (Math.PI / 180) - Math.PI)
  emit('update-gain', knobLevel.value / 10)
}

/**
 * @method initAudioBufferArray
 */

const initAudioBufferArray = () => {
  const bufferLength = analyser.value.frequencyBinCount
  audioBufferArray.value = new Uint8Array(bufferLength)
}

/**
 * @method calculateOutputLevel
 */

const calculateOutputLevel = () => {
  analyser.value.getByteFrequencyData(audioBufferArray.value)
  let sum = 0
  for (const amplitude of audioBufferArray.value) {
    sum += amplitude * amplitude
  }
  mixerLevel.value = Math.sqrt(sum / audioBufferArray.value.length)
  requestId.value = requestAnimationFrame(calculateOutputLevel)
}

// ======================================================================= Hooks
onMounted(() => {
  if (audioContext.value) { initAudioBufferArray() }
})

onBeforeUnmount(() => {
  if (requestId.value) { cancelAnimationFrame(requestId.value) }
})

</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.volume-tool {
  --parent-radius: 66px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  padding: calc(var(--parent-radius) * 0.075) 0;
  width: calc(2 * var(--parent-radius));
  height: calc(2 * var(--parent-radius));
  touch-action: none;
  .meter {
    :deep(.audio-meter-svg) {
      width: calc(var(--parent-radius) * 1.54);
      height: calc(var(--parent-radius) * 0.757);
    }
  }
  .knob {
    width: calc(var(--parent-radius) * 0.96);
    height: calc(var(--parent-radius) * 0.96);
  }
  .size-button {
    &:first-child,
    &:last-child {
      margin-bottom: calc(var(--parent-radius) * 0.166);
    }
    :deep(svg) {
      width: calc(var(--parent-radius) * 0.65);
      height: calc(var(--parent-radius) * 0.33);
    }
    &.retrigger-button {
      :deep(svg) {
        width: calc(var(--parent-radius) * 0.48);
        height: calc(var(--parent-radius) * 0.48);
      }
    }
  }
}

.meter,
.step-controls {
  height: torem(42);
}

// ////////////////////////////////////////////////////////////////// Audio Meter
.meter {
  position: relative;
  width: 100%;
}

.audio-meter-svg {
  --needle-angle: -60deg;
  position: absolute;
  left: 50%;
  top: 0;
  transform: translateX(-50%);
  :deep(.needle) {
    transition: 100ms linear;
    transform-origin: 51px 50px;
    transform: rotate(var(--needle-angle));
  }
}
// //////////////////////////////////////////////////////////////////////// Knob
.volume-knob {
  position: relative;
  width: 100%;
}

:deep(.radial-slider-bounded) {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  .track {
    border: none;
  }
  .cover {
    display: none;
  }
  .thumb {
    opacity: 0;
  }
}

.notch {
  position: absolute;
  width: calc(100% - torem(18));
  height: calc(100% - torem(18));
  top: torem(9);
  left: torem(9);
  transform: rotate(45deg);
  &:after {
    content: '';
    position: absolute;
    left: calc(50% - torem(1));
    top: 0;
    width: 0;
    height: torem(10);
    border-left: solid torem(1) white;
    border-right: solid torem(1) white;
  }
}

// ///////////////////////////////////////////////////////////// Bottom Controls
.step-controls {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: flex-end;
}

.size-button {
  position: relative;
  display: flex;
  &:first-child,
  &:last-child {
    transition: 150ms ease;
    filter: drop-shadow(0px 1px 1px rgba(#2C2E35, 0.5));
    &:hover {
      transform: scale(1.05);
      filter: drop-shadow(0px 1px 2px rgba(#2C2E35, 0.5));
    }
  }
  .input {
    position: absolute;
    left: 50%;
    top: 50%;
    width: torem(26);
    transform: translate(-50%, -50%);
    color: white;
    font-size: torem(12);
    font-family: 'Source Code Pro';
    font-weight: 600;
    line-height: 1;
    text-align: center;
    pointer-events: none; // remove to enable input interaction
  }
  .label {
    position: absolute;
    left: 50%;
    top: calc(50% - torem(2));
    transform: translate(-50%, -50%);
    font-family: 'Nunito';
    font-weight: 800;
    color: $stormGray;
    -webkit-user-select: none; /* Safari */
    -ms-user-select: none; /* IE 10 and IE 11 */
    user-select: none; /* Standard syntax */
    @include small {
      font-size: torem(18);
    }
  }
}

input[type=number]::-webkit-inner-spin-button, 
input[type=number]::-webkit-outer-spin-button { 
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  margin: 0;
  -webkit-user-select: none; /* Safari */
  -ms-user-select: none; /* IE 10 and IE 11 */
  user-select: none; /* Standard syntax */
}
</style>
