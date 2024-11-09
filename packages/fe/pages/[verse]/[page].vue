<template>
  <div class="page-container">
    <!-- ============================================================== Page -->
    <div
      ref="pageRef"
      :draggable="dragndrop"
      :data-location="pageName"
      class="page">
      <ClientOnly>
        <v-stage ref="stageRef" :config="canvasConfig" @wheel="handleMouseWheel">
          <v-layer ref="layerRef">

            <v-rect :config="{
              width: bounds.x,
              height: bounds.y,
              fillLinearGradientStartPoint: { x: 0, y: 0 },
              fillLinearGradientEndPoint: { x: bounds.x, y: bounds.y },
              fillLinearGradientColorStops: [0, 'yellow', 0.5, 'blue', 0.6, 'red']
            }" />

            <v-circle :config="{ radius: 50, fill: 'green', x: 0, y: 0 }"/>

            <Thingie
              v-for="thingie in pageThingies"
              :key="thingie._id"
              :thingie="thingie"
              @init-update="initUpdate" />

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

const pageRef = ref(null)
const stageRef = ref(null)
const layerRef = ref(null)
const canvasConfig = ref({})
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

// watch(bounds, (val) => {
//   const layer = layerRef.value.getNode()
//   layer.position({ x: val.x * 0.5, y: val.y * 0.5 })
// })

watch(zoom, (newVal, oldVal) => {
  let dir = 1
  if (oldVal > newVal) {
    dir = -1
  }
  scaleScene(dir)
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
  e.evt.preventDefault()
  const dx = e.evt.deltaX
  const dy = e.evt.deltaY
  const stage = stageRef.value.getNode()
  const layer = layerRef.value.getNode()
  const width = bounds.value.x
  const height = bounds.value.y
  const minX = -1 * (width - stage.width())
  const x = Math.max(minX, Math.min(layer.x() - dx, 0)) // 0 = maxX
  const minY = -1 * (height - stage.height())
  const y = Math.max(minY, Math.min(layer.y() - dy, 0)) // 0 = maxY
  layer.position({ x, y })
}

const scaleScene = amt => {
  const stage = stageRef.value.getNode()
  const oldScale = stage.scaleX()
  const scaleBy = 1.01
  const pointer = stage.getPointerPosition()

  const mousePointTo = {
    x: (pointer.x - stage.x()) / oldScale,
    y: (pointer.y - stage.y()) / oldScale
  }

  const newScale = amt > 0 ? oldScale * scaleBy : oldScale / scaleBy

  stage.scale({ x: newScale, y: newScale })

  const newPos = {
    x: pointer.x - mousePointTo.x * newScale,
    y: pointer.y - mousePointTo.y * newScale
  }
  
  stage.position(newPos)
  console.log(stage.position())
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
