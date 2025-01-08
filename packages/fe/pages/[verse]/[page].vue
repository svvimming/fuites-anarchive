<template>
  <div class="page-container">
    <!-- ============================================================ Loader -->
    <SpinnerTripleDot
      v-if="verse.loading || page.loading || thingies.loading"
      theme="dark" />
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
          @click="handleClick($event)"
          @dblclick="handleDoubleClick($event)">
          <v-layer ref="layerRef" :config="initLayer">

            <Thingie
              v-for="thingie in pageThingies"
              :key="thingie._id"
              :thingie="thingie" />

            <Portal
              v-if="portalsActive"
              v-for="portal in pagePortals"
              :key="portal._id"
              :portal="portal" />

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
const { verse, page, portalCreatorOpen, sceneData } = storeToRefs(verseStore)
const collectorStore = useCollectorStore()
const { thingies, editing } = storeToRefs(collectorStore)
const generalStore = useGeneralStore()
const { dragndrop, activeModes } = storeToRefs(generalStore)
const pocketStore = usePocketStore()
const { authenticated } = storeToRefs(pocketStore)

const { data } = await useAsyncData(route.fullPath, async () => {
  const content = await queryContent({
    where: {
      _file: { $contains: 'settings.json' }
    }
  }).find()
  return content[0]
}, { server: false })

const pageRef = ref(null)
const stageRef = ref(null)
const layerRef = ref(null)
const initLayer = ref({})
const canvasConfig = ref({ id: 'page-canvas' })
const resizeEventListener = ref(false)
const keydownEventListener = ref(false)
const { initPageshot } = usePageshotBot(stageRef)

useHandleThingieDragEvents(pageRef, stageRef)

// ==================================================================== Computed
const pageName = computed(() => route.params.page)
const bounds = computed(() => page.value.data?.bounds || { x: 2372, y: 2000 })
const pageThingies = computed(() => thingies.value.data.filter(thingie => thingie.location === pageName.value).sort((a, b) => a.zIndex - b.zIndex))
const pagePortals = computed(() => page.value.data?.filtered_portals || [])
const portalsActive = computed(() => activeModes.value.portals)

// ==================================================================== Watchers
watch(data, async () => {
  const vrs = route.params.verse
  const slug = route.params.page
  await generalStore.setSiteData({ key: 'settings', value: data.value })
  const result = await verseStore.getVerse({ verse: vrs })
  if (result) {
    await verseStore.getPage({ page: slug })
    await collectorStore.getThingies()
  } else {
    await navigateTo('/multiverse')
  }
}, { immediate: true })

// ===================================================================== Methods
/**
 * @method handleClick
 */

const handleClick = e => {
  if (authenticated.value) {
    // Handle closing Caddy/Thingie editing
    const target = e.target
    const targetIsThingie = target.attrs.hasOwnProperty('thingie_id')
    if (editing.value) {
      if (targetIsThingie) {
        setTimeout(() => {
          if (target.attrs.thingie_id !== editing.value) {
            collectorStore.setEditing(false)
          }
        }, 250)
      } else {
        collectorStore.setEditing(false)
      }
    }
    // Handle toggling Portal Creator
    if (e.evt.shiftKey) {
      verseStore.setPortalCreatorOpen(e)
    } else if (portalCreatorOpen.value) {
      verseStore.setPortalCreatorOpen(false)
    }
  }
}

/**
 * @method handleDoubleClick
 */

const handleDoubleClick = e => {
  const target = e.target
  if (authenticated.value && target.attrs.hasOwnProperty('id') && target.attrs.id === 'page-canvas') {
    collectorStore.addNewTextThingie({
      x: e.evt.clientX,
      y: e.evt.clientY
    })
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
  const minX = -1 * (width - (stage.width() / scale))
  const x = Math.max(minX, Math.min(position.x, 0))
  const minY = -1 * (height - (stage.height() / scale)) 
  const y = Math.max(minY, Math.min(position.y, 0))
  layer.position({ x, y })
  verseStore.updateSceneData({ x, y })
}

/**
 * @method scaleScene
 * @desc Zoom the page in and out
 */

const scaleScene = (dir, noScale = false) => {
  const stage = stageRef.value.getNode()
  const layer = layerRef.value.getNode()
  const limits = bounds.value
  const oldScale = stage.scaleX()
  const scaleBy = noScale ? 1 : 1.01
  const canvasCenter = {
    x: stage.width() * 0.5,
    y: stage.height() * 0.5
  }
  const zoomCenter = {
    x: (canvasCenter.x - stage.x()) / oldScale,
    y: (canvasCenter.y - stage.y()) / oldScale
  }
  const ratio = dir > 0 ? oldScale * scaleBy : oldScale / scaleBy
  // Calculate the new scale. Limit it to be no less that the larger of the two ratios; view width / page width, or, view height / page height
  const newScale = Math.max(ratio, Math.max(stage.width() / limits.x, stage.height() / limits.y))
  stage.scale({ x: newScale, y: newScale })
  verseStore.updateSceneData({ scale: newScale })
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
  Object.assign(canvasConfig.value, { width: window.innerWidth, height: window.innerHeight })
}

// ======================================================================= Hooks
onMounted(() => {
  // Set canvas dimensions based on current viewport dimensions
  setCanvasDimensions()
  // Initialize scene position and scale
  if (sceneData.value.initialized) {
    initLayer.value = { x: sceneData.value.x, y: sceneData.value.y }
  } else {
    initLayer.value = {
      x: -0.5 * (bounds.value.x - canvasConfig.value.width),
      y: -0.5 * (bounds.value.y - canvasConfig.value.height)
    }
    verseStore.updateSceneData({ initialized: true })
  }
  Object.assign(canvasConfig.value, { scaleX: sceneData.value.scale, scaleY: sceneData.value.scale })
  // Add event listeners
  resizeEventListener.value = useThrottleFn(() => {
    setCanvasDimensions()
    nextTick(() => { scaleScene(1, true) })
  }, 25)
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
  // Initialize canvas screencap
  /** @TODO implement a better way than using setTimeout to initiate screenshots after all thingies have loaded */
  // setTimeout(() => {
  //   if (page.value?.data.init_screencap) {
  //     initPageshot()
  //   }
  // }, 2000)
})

onBeforeUnmount(() => {
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

:deep(.triple-dot-loader) {
  position: absolute;
  top: torem(45);
  left: 50%;
  transform: translate(-50%, -50%);
}

.page {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
}
</style>
