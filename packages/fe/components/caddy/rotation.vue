<template>
  <div class="rotation">

    <RadialSliderInfinite
      ref="slider"
      @degree-change="handleDegreeChange" />

    <ButtonIcon
      :force-disabled="true"
      class="rotation-icon solid-outline">
      <IconRotation class="icon" />
    </ButtonIcon>

  </div>
</template>

<script setup>
// ======================================================================= Setup
const props = defineProps({
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
  display: flex;
  justify-content: center;
  align-items: center;
  width: torem(152);
  height: torem(152);
}

.rotation-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  width: torem(52);
  height: torem(52);
  transform: translate(-50%, -50%);
  --two-tone-a: #{$stormGray};
  --two-tone-b: white;
  .icon {
    :deep(rect),
    :deep(path) {
      stroke: $stormGray;
    }
  }
}
</style>
