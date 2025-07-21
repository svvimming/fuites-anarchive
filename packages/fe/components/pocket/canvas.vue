<template>
  <div
    id="pocket-canvas"
    ref="pocketRef"
    :draggable="dragndrop"
    data-location="pocket">

    <ClientOnly>
      <v-stage ref="stageRef" :config="pocketCanvasConfig">
        <v-layer>
          <Thingie
            v-for="thingie in pocketThingies"
            :key="thingie._id"
            :thingie="thingie"
            :force-bounds="forceBounds" />
        </v-layer>
      </v-stage>
    </ClientOnly>

  </div>
</template>

<script setup>
// ===================================================================== Imports
import { useThrottleFn } from '@vueuse/core'

// ======================================================================= Props
const props = defineProps({
  pocketThingies: {
    type: Array,
    required: true
  }
})

// ======================================================================== Data
const generalStore = useGeneralStore()
const { dragndrop } = storeToRefs(generalStore)

const pocketRef = ref(null)
const stageRef = ref(null)
const resizeEventListener = ref(false)
const pocketCanvasConfig = ref({
  width: 650,
  height: 400
})

useHandleThingieDragEvents(pocketRef, stageRef)

// ==================================================================== Computed
const forceBounds = computed(() => ({ x: pocketCanvasConfig.value.width, y: pocketCanvasConfig.value.height }))

// ===================================================================== Methods
const getPocketCanvasConfig = useThrottleFn(() => {
  if (!pocketRef.value) return
  const pocketRect = pocketRef.value.getBoundingClientRect()
  pocketCanvasConfig.value.width = Math.max(pocketRect.width, 650)
  pocketCanvasConfig.value.height = Math.max(pocketRect.height, 400)
}, 50)

// ======================================================================= Hooks
onMounted(() => {
  // Register the resize event listener
  resizeEventListener.value = () => { getPocketCanvasConfig() }
  window.addEventListener('resize', resizeEventListener.value)
  // Get the initial pocket canvas config
  nextTick(() => {
    setTimeout(() => {
      getPocketCanvasConfig()
    }, 500)
  })
})

onBeforeUnmount(() => {
  if (resizeEventListener.value) {
    window.removeEventListener('resize', resizeEventListener.value)
  }
})
</script>

<style lang="scss" scoped>
#pocket-canvas {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
}
</style>
