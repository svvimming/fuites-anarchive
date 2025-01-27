<template>
  <div class="resize">

    <RadialSliderInfinite
      ref="resizeSliderRef"
      mode="relative"
      :radius="thingie?.thingie_type === 'sound' ? 56 : 46"
      class="resize-slider"
      @add-delta="handleResize" />

    <RadialSliderInfinite
      v-if="thingie?.thingie_type === 'sound'"
      ref="strokeSliderRef"
      mode="relative"
      :radius="40"
      class="stroke-width-slider"
      @add-delta="handleStrokeWidthResize" />

    <ButtonIcon
      :force-disabled="true"
      class="resize-icon solid-outline">
      <IconScale class="icon" />
    </ButtonIcon>

  </div>
</template>

<script setup>
// ======================================================================= Setup
const emit = defineEmits(['resize-thingie', 'update-stroke-width'])

// ======================================================================== Data
const collectorStore = useCollectorStore()
const { thingies, editing } = storeToRefs(collectorStore)
const resizeSliderRef = ref(null)
const strokeSliderRef = ref(null)

// ==================================================================== Computed
const thingie = computed(() => thingies.value.data.find(item => item._id === editing.value))
const dimensions = computed(() => thingie.value?.at)
const strokeWidth = computed(() => thingie.value?.stroke_width)

// ==================================================================== Watchers
watch(editing, () => {
  if (resizeSliderRef.value) {
    resizeSliderRef.value.setTheta(0)
  }
  if (strokeSliderRef.value) {
    strokeSliderRef.value.setTheta(0)
  }
})

// ===================================================================== Methods
const handleResize = delta => {
  if (dimensions.value) {
    const width = dimensions.value.width
    const height = dimensions.value.height
    const scale = 1 + (delta * 0.1)
    emit('resize-thingie', {
      width: width * scale,
      height: height * scale
    })
  }
}

const handleStrokeWidthResize = delta => {
  if (strokeWidth.value) {
    const scale = 1 + delta
    emit('update-stroke-width', strokeWidth.value * scale)
  }
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.resize {
  display: flex;
  justify-content: center;
  align-items: center;
  width: torem(152);
  height: torem(152);
}

.resize-icon {
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

.stroke-width-slider {
  position: absolute;
}
</style>
