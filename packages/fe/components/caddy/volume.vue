<template>
  <div class="volume-tool">
    
    <div class="meter">
      <IconAudioMeter class="audio-meter-svg" />
    </div>

    <div class="volume-knob">
      <RadialSliderBounded
        ref="volumeSliderRef"
        v-slot="{ theta }"
        :radius="32"
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
          v-model="level"
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
const emit = defineEmits(['update-gain'])

// ======================================================================== Data
const collectorStore = useCollectorStore()
const { thingies, editing } = storeToRefs(collectorStore)
const volumeSliderRef = ref(null)
const level = ref(0)

// ==================================================================== Computed
const thingie = computed(() => thingies.value.data.find(item => item._id === editing.value))

// ==================================================================== Watchers
watch(editing, () => {
  if (volumeSliderRef.value && thingie.value?.thingie_type === 'sound') {
    const defaultDegree = (thingie.value.gain * (303 - 57)) + 57 // map gain to degree range of knob
    volumeSliderRef.value.setTheta(defaultDegree * (Math.PI / 180) - Math.PI)
    level.value = Math.round(thingie.value.gain * 10)
  }
})

// ===================================================================== Methods
/**
 * @method handleVolumeChange
 */

const handleVolumeChange = val => {
  level.value = Math.round(val * 10)
  emit('update-gain', val)
}

/**
 * @method handleIncrementVolume
 */

const handleIncrementVolume = val => {
  level.value = Math.max(0, Math.min(level.value + val, 10))
  const degree = ((level.value / 10) * (303 - 57)) + 57 // map level to degree range of knob
  volumeSliderRef.value.setTheta(degree * (Math.PI / 180) - Math.PI)
  emit('update-gain', level.value / 10)
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.volume-tool {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  padding: torem(13) 0;
  width: torem(142);
  height: torem(142);
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
  position: absolute;
  left: 50%;
  top: 0;
  transform: translateX(-50%);
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

.knob {
  width: torem(64);
  height: torem(64);
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
    margin-bottom: torem(11);
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
