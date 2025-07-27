<template>
  <div class="rotation" :style="{ '--parent-radius': `${parentRadius}px` }">

    <RadialSliderInfinite
      ref="slider"
      :radius="parentRadius * 0.7"
      @degree-change="handleDegreeChange" />

    <ButtonCaddy
      :force-disabled="true"
      :force-pressed="true"
      tool="rotation"
      class="rotation-icon">
      <IconRotation class="icon" />
    </ButtonCaddy>

  </div>
</template>

<script setup>
// ======================================================================= Setup
const props = defineProps({
  parentRadius: {
    type: Number,
    required: false,
    default: 66
  },
  defaultAngle: {
    type: Number,
    required: false,
    default: 0
  }
})
const emit = defineEmits(['update-rotation'])

// ======================================================================== Data
const slider = ref(null)

// ==================================================================== Watchers
watch(() => props.defaultAngle, (deg) => {
  if (slider.value) {
    slider.value.setTheta(deg * (Math.PI / 180))
  }
})

// ===================================================================== Methods
const handleDegreeChange = deg => {
  emit('update-rotation', deg)
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.rotation {
  --parent-radius: 66px;
  display: flex;
  justify-content: center;
  align-items: center;
  width: calc(2 * var(--parent-radius));
  height: calc(2 * var(--parent-radius));
  touch-action: none;
}

.rotation-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  width: torem(52);
  height: torem(52);
  transform: translate(-50%, -50%);
  .icon {
    width: torem(20);
    height: torem(20);
    :deep(rect),
    :deep(path) {
      stroke: white;
    }
  }
}
</style>
