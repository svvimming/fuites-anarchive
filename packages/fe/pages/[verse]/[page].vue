<template>
  <div class="page-container">
    <!-- ============================================================== Page -->
    <div
      ref="pageRef"
      :draggable="dragndrop"
      :data-location="pageName"
      class="page">
      <ClientOnly>
        <v-stage
          ref="stageRef"
          :config="canvasConfig"
          @wheel="handleMouseWheel($event)"
          @click="handleClick($event)">
          <v-layer ref="layerRef">

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
const { page } = storeToRefs(verseStore)
const collectorStore = useCollectorStore()
const { thingies, editing } = storeToRefs(collectorStore)
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
const keydownEventListener = ref(false)

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
 * @method handleClick
 */

const handleClick = e => {
  const target = e.target
  const targetIsThingie = target.attrs.hasOwnProperty('thingie_id')
  if (editing.value && (!targetIsThingie || target.attrs.thingie_id !== editing.value)) {
    collectorStore.setEditing(false)
  }
}

/**
 * @method handleMouseWheel
 * @desc Forward mouse wheel event deltas to positionScene
 */

const handleMouseWheel = e => {
  e.evt.preventDefault()
  const layer = layerRef.value.getNode()
  positionScene({
    x: layer.x() - e.evt.deltaX,
    y: layer.y() - e.evt.deltaY
  })
}

/**
 * @method positionScene
 * @desc Moves the current scene around on the 2d plane of the page
 */

const positionScene = position => {
  const stage = stageRef.value.getNode()
  const layer = layerRef.value.getNode()
  const limit = bounds.value
  const scale = stage.scaleX()
  const width = limit.x
  const height = limit.y
  const minX = -1 * (width - stage.width())
  const x = Math.max(minX * scale, Math.min(position.x, 0)) // 0 = maxX
  const minY = -1 * (height - stage.height()) 
  const y = Math.max(minY * scale, Math.min(position.y, 0)) // 0 = maxY
  layer.position({ x, y })
}

/**
 * @method scaleScene
 * @desc Zoom the page in and out
 */

const scaleScene = dir => {
  const stage = stageRef.value.getNode()
  const layer = layerRef.value.getNode()
  const oldScale = stage.scaleX()
  const scaleBy = 1.01
  const canvasCenter = {
    x: canvasConfig.value.width * 0.5,
    y: canvasConfig.value.height * 0.5
  }
  const zoomCenter = {
    x: (canvasCenter.x - stage.x()) / oldScale,
    y: (canvasCenter.y - stage.y()) / oldScale
  }
  const newScale = dir > 0 ? oldScale * scaleBy : oldScale / scaleBy
  stage.scale({ x: newScale, y: newScale })
  positionScene({
    x: canvasCenter.x - (zoomCenter.x * newScale) + layer.x(),
    y: canvasCenter.y - (zoomCenter.y * newScale) + layer.y()
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
  keydownEventListener.value = e => {
    const key = e.key
    const code = e.code
    const keyCode = e.keyCode
    const minus = key === '-' || code === 'Minus' || keyCode === 189
    const plus = key === '+' || code === 'Equal' || keyCode === 187
    if (minus && e.metaKey) {
      e.preventDefault()
      scaleScene(-1)
    }
    if (plus && e.metaKey) {
      e.preventDefault()
      scaleScene(1)
    }
  }
  window.addEventListener('keydown', keydownEventListener.value)
})

onBeforeUnmount(() => {
  document.body.classList.remove('no-scroll')
  window.removeEventListener('resize', resizeEventListener.value)
  window.removeEventListener('keydown', keydownEventListener.value)
})
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
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
