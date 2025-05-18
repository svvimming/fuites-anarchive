<template>
  <div class="layer-opacity-tool">

    <div class="panel opacity-tool">
      <div class="slider-wrapper">
        <RadialSliderBounded
          ref="opacitySliderRef"
          :input-range="[20, 160]"
          :output-range="[0.1, 1]"
          :include-thumb-bounds="true"
          @degree-change="handleDegreeChange" />
      </div>
    </div>

    <div class="panel layer-tool">
      <button
        class="layer-button"
        @click="emit('bring-forward')">
        <IconLayerUpButton />
      </button>
      <button
        class="layer-button"
        @click="emit('send-back')">
        <IconLayerDownButton />
      </button>
    </div>

    <ButtonCaddy
      :force-disabled="true"
      :force-pressed="true"
      tool="layer-opacity"
      class="layer-opacity-icon">
      <IconLayerOpacity class="icon" />
    </ButtonCaddy>
    
  </div>
</template>

<script setup>
// ======================================================================= Setup
const emit = defineEmits(['send-back', 'bring-forward', 'update-opacity'])

// ======================================================================== Data
const collectorStore = useCollectorStore()
const { thingies, editing } = storeToRefs(collectorStore)
const opacitySliderRef = ref(null)

// ==================================================================== Computed
const thingie = computed(() => thingies.value.data.find(item => item._id === editing.value))
const opacity = computed(() => thingie.value?.opacity)

// ==================================================================== Watchers
watch(editing, () => {
  if (opacitySliderRef.value) {
    const defaultDegree = ((opacity.value - 0.1) * (160 - 20) / (1.0 - 0.1)) + 20
    opacitySliderRef.value.setTheta(defaultDegree * (Math.PI / 180) - Math.PI)
  }
})

// ===================================================================== Methods
const handleDegreeChange = val => {
  emit('update-opacity', val)
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.layer-opacity-tool {
  display: flex;
  justify-content: center;
  align-items: center;
  width: torem(152);
  height: torem(152);
}

.panel {
  position: relative;
  width: 50%;
}

.opacity-tool {
  height: 100%;
}

.slider-wrapper {
  position: absolute;
  right: torem(8);
  top: 50%;
  width: torem(50);
  transform: translate(0, -50%);
  padding: torem(8) 0 torem(8) torem(10);
  overflow: hidden;
}

.layer-tool {
  display: flex;
  flex-direction: column;
}

.layer-button {
  display: flex;
  width: fit-content;
  padding: torem(2) torem(3);
  transition: 150ms ease;
  filter: drop-shadow(0px 1px 1px rgba(#2C2E35, 0.5));
  &:hover {
    transform: scale(1.05);
    filter: drop-shadow(0px 1px 2px rgba(#2C2E35, 0.5));
  }
}

.layer-opacity-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  width: torem(52);
  height: torem(52);
  transform: translate(-50%, -50%);
  .icon {
    width: torem(20);
    height: torem(20);
  }
}
</style>
