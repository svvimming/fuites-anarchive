<template>
  <div class="page-container">
    <!-- ============================================================== Page -->
    <div
      ref="pageRef"
      :draggable="dragndrop"
      :data-location="pageName"
      class="page">
      <ClientOnly>
        <v-stage ref="stageRef" :config="canvasConfig">
          <v-layer>
            <v-group :config="sceneConfig" __use-strict-mode>

              <v-rect
                :config="{
                  width: bounds.x, height: bounds.y, x: 0, y: 0, fillRadialGradientStartPoint: { x: bounds.x / 2, y: bounds.x / 2 },
                  fillRadialGradientStartRadius: bounds.x / 2,
                  fillRadialGradientEndPoint: { x: 0, y: 0 },
                  fillRadialGradientEndRadius: 0,
                  fillRadialGradientColorStops: [0, 'red', 0.5, 'yellow', 1, 'blue'] }"
                @wheel="handleMouseWheel" />

              <Thingie
                v-for="thingie in pageThingies"
                :key="thingie._id"
                :thingie="thingie"
                @init-update="initUpdate" />

            </v-group>
          </v-layer>
        </v-stage>
      </ClientOnly>
    </div>

  </div>
</template>

<script setup>
// ====================================================================== Import
import { useThrottleFn } from '@vueuse/core'

// ======================================================================== Data
const route = useRoute()
const verseStore = useVerseStore()
const { page, zoom } = storeToRefs(verseStore)
const collectorStore = useCollectorStore()
const { thingies } = storeToRefs(collectorStore)
const generalStore = useGeneralStore()
const { sessionId, dragndrop } = storeToRefs(generalStore)
const websocketStore = useWebsocketStore()
const { socket } = storeToRefs(websocketStore)

const { data } = await useAsyncData('settings', async () => {
  const content = await queryContent({
    where: {
      _file: { $contains: 'settings.json' }
    }
  }).find()
  return content[0]
})

const pageRef = ref(false)
const stageRef = ref(false)
const canvasConfig = ref({})
const sceneConfig = ref({})
const resizeEventListener = ref(false)

useHandleThingieDragEvents(pageRef, stageRef)

// ==================================================================== Computed
const verseName = computed(() => route.params.verse)
const pageName = computed(() => route.params.page)
const bounds = computed(() => page.value.data.bounds || { x: 0, y: 0 })
const pageThingies = computed(() => thingies.value.data.filter(thingie => thingie.location === pageName.value))

// ==================================================================== Watchers
watch(data, async () => {
  await verseStore.getVerse({ verse: verseName.value })
  await verseStore.getPage({ page: pageName.value })
  await generalStore.setSiteData({ key: 'settings', value: data.value })
  await collectorStore.getThingies()
}, { immediate: true })

watch(zoom, (val) => {
  console.log(val)
  sceneConfig.value = Object.assign(sceneConfig.value, {
    scale: {
      x: val,
      y: val
    }
  })
})

// ===================================================================== Methods
/**
 * @method initUpdate
 * @desc Emits a thinige update to the 'thingies' room using the websocket store socket. If updating the `at` property, the session id is recorded into the update and the thingie is also directly updated in the store rather than waiting for a response over the network.
 */

const initUpdate = update => {
  if (update.hasOwnProperty('at')) {
    const updateAt = Object.assign({}, update, { omit_session_id: sessionId.value })
    socket.value.emit('update-thingie', updateAt)
    collectorStore.updateThingie(updateAt)
  } else {
    socket.value.emit('update-thingie', update)
  }
}

/**
 * @method handleMouseWheel
 * @desc Moves the current scene around on the 2d plane of the page
 */

const handleMouseWheel = e => {
  const position = e.target.absolutePosition()
  sceneConfig.value = Object.assign(sceneConfig.value, {
    x: Math.max(canvasConfig.value.width - bounds.value.x, Math.min(position.x - e.evt.deltaX, 0)),
    y: Math.max(canvasConfig.value.height - bounds.value.y, Math.min(position.y - e.evt.deltaY, 0))
  })
}

/**
 * @method setCanvasDimensions
 * @desc Sets the canvas dimensions based on the current viewport dimensions
 */

const setCanvasDimensions = () => {
  canvasConfig.value = { width: window.innerWidth, height: window.innerHeight }
}

// ======================================================================= Hooks
onMounted(() => {
  document.body.classList.add('no-scroll')
  setCanvasDimensions()
  resizeEventListener.value = useThrottleFn(() => { setCanvasDimensions() }, 25)
  window.addEventListener('resize', resizeEventListener.value)
})

onBeforeUnmount(() => {
  document.body.classList.remove('no-scroll')
  window.removeEventListener('resize', resizeEventListener.value)
})
</script>

<style lang="scss" scoped>
.page-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.page {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
}
</style>
