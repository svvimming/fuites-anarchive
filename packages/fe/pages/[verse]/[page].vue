<template>
  <div class="page-container">
    <!-- ============================================================ Loader -->
    <SpinnerTripleDot
      v-show="verse.loading || page.loading || thingies.loading"
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
          @dblclick="handleDoubleClick($event)"
          @mousemove="handleMouseMove($event)"
          @mouseleave="handleMouseLeave($event)">
          <v-layer ref="layerRef" :config="initLayer">

            <Thingie
              v-for="thingie in pageThingies"
              :key="thingie._id"
              :thingie="thingie"
              @record-load="handleRecordLoad" />

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
import SettingsData from '@/data/settings.json'

// ======================================================================== Data
const route = useRoute()
const verseStore = useVerseStore()
const { verse, page, portalCreatorOpen, sceneData } = storeToRefs(verseStore)
const collectorStore = useCollectorStore()
const { thingies, editing } = storeToRefs(collectorStore)
const generalStore = useGeneralStore()
const { dragndrop, activeModes, mouseOverScene } = storeToRefs(generalStore)
const pocketStore = usePocketStore()
const { authenticated } = storeToRefs(pocketStore)

const { data } = await useAsyncData(`page-${route.fullPath}`, async () => await verseStore.getVerse({ verse: route.params.verse }), { server: false })

const pageRef = ref(null)
const stageRef = ref(null)
const layerRef = ref(null)
const initLayer = ref({})
const canvasConfig = ref({ id: 'page-canvas' })
const resizeEventListener = ref(false)
const keyupEventListener = ref(false)
const keydownEventListener = ref(false)
const loadedIds = ref([])
const pageshotReady = ref(false)
const { initPageshot, status } = usePageshotBot(stageRef)
const controller = ref({
  arrowLeft: false,
  arrowRight: false,
  arrowUp: false,
  arrowDown: false
})

useHandleThingieDragEvents(pageRef, stageRef)

// ==================================================================== Computed
const pageName = computed(() => route.params.page)
const bounds = computed(() => page.value.data?.bounds || { x: 2372, y: 2000 })
const pageThingies = computed(() => thingies.value.data.filter(thingie => thingie.location === pageName.value).sort((a, b) => a.zIndex - b.zIndex))
const pagePortals = computed(() => page.value.data?.filtered_portals || [])
const portalsActive = computed(() => activeModes.value.portals)
const textImageIds = computed(() => pageThingies.value.filter(item => ['image', 'text'].includes(item.thingie_type)).map(item => item._id))

// ==================================================================== Watchers
watch(data, async (val) => {
  if (val) {
    if (verse.value.data?.name) {
      // Set site data and fetch page data
      await generalStore.setSiteData({ key: 'settings', value: SettingsData })
      await verseStore.getPage({ page: route.params.page })
      // Check local storage for auth token and try to authenticate if found
      const localStorageAuthToken = localStorage.getItem('fuitesAnarchiveAuthToken')
      if (!authenticated.value && localStorageAuthToken) {
        await pocketStore.getAuthPocket({ token: localStorageAuthToken, localStorageAuth: true })
      }
      // Fetch thingies
      await collectorStore.getThingies()
    } else {
      await navigateTo('/')
    }
  }
}, { immediate: true })

watch(loadedIds, (ids) => {
  pageshotReady.value = textImageIds.value.every(id => ids.includes(id))
  if (page.value?.data?.init_screencap && pageshotReady.value && status.value !== 'complete') {
    initPageshot()
  }
}, { deep: true })

// ===================================================================== Methods
/**
 * @method handleRecordLoad
 */

const handleRecordLoad = id => {
  if (!loadedIds.value.includes(id)) {
    loadedIds.value.push(id)
  }
}

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
    if (e.evt.shiftKey && !target.attrs.hasOwnProperty('portal_id')) {
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
  if (Object.values(controller.value).some(value => value)) {
    controller.value = {
      arrowLeft: false,
      arrowRight: false,
      arrowUp: false,
      arrowDown: false
    }
  }
}

/**
 * @method handleMouseMove
 */

const handleMouseMove = e => {
  const attrs = e.target.attrs
  const type = attrs.hasOwnProperty('thingie_id') ?
                'thingie' :
                attrs.hasOwnProperty('portal_id') ?
                  'portal' :
                  attrs.id === 'page-canvas' ?
                    'canvas' : false
  const mouseOver = mouseOverScene.value
  if (!type && mouseOver) {
    generalStore.setMouseOverScene(false)
  } else if (type === 'canvas' && mouseOver?.type !== 'canvas') {
    generalStore.setMouseOverScene({ type: 'canvas', attrs })
  } else if (type === 'thingie' && mouseOver?.attrs?.thingie_id !== attrs.thingie_id) {
    generalStore.setMouseOverScene({ type: 'thingie', attrs })
  } else if (type === 'portal' && mouseOver?.attrs?.portal_id !== attrs.portal_id) {
    generalStore.setMouseOverScene({ type: 'portal', attrs })
  }
}

/**
 * @method handleMouseLeave
 */

const handleMouseLeave = () => {
  if (mouseOverScene.value) {
    generalStore.setMouseOverScene(false)
  }
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

/**
 * @method initController
 * @desc Initializes the arrow key controller for the given key
 */

const initController = key => {
  controller.value[key] = true
  const moveAmount = 5
  const moveInterval = setInterval(() => {
    if (!controller.value[key]) {
      clearInterval(moveInterval)
      return
    }
    const layer = layerRef.value.getNode()
    const currentX = layer.x()
    const currentY = layer.y()
    let newX = currentX
    let newY = currentY
    switch (key) {
      case 'arrowLeft':
        newX = currentX + moveAmount
        break
      case 'arrowRight':
        newX = currentX - moveAmount
        break
      case 'arrowUp':
        newY = currentY + moveAmount
        break
      case 'arrowDown':
        newY = currentY - moveAmount
        break
    }
    positionScene({ x: newX, y: newY })
  }, 16)
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
    verseStore.updateSceneData(Object.assign({ initialized: true }, initLayer.value))
  }
  Object.assign(canvasConfig.value, { scaleX: sceneData.value.scale, scaleY: sceneData.value.scale })
  // Add event listeners
  resizeEventListener.value = useThrottleFn(() => {
    setCanvasDimensions()
    nextTick(() => { scaleScene(1, true) })
  }, 25)
  window.addEventListener('resize', resizeEventListener.value)
  // Handle keydown events
  keydownEventListener.value = e => {
    const key = e.key
    const code = e.code
    const keyCode = e.keyCode
    const minus = key === '-' || code === 'Minus' || keyCode === 189
    const plus = key === '+' || code === 'Equal' || keyCode === 187
    const arrowLeft = key === 'ArrowLeft' || code === 'ArrowLeft' || keyCode === 37
    const arrowRight = key === 'ArrowRight' || code === 'ArrowRight' || keyCode === 39
    const arrowUp = key === 'ArrowUp' || code === 'ArrowUp' || keyCode === 38
    const arrowDown = key === 'ArrowDown' || code === 'ArrowDown' || keyCode === 40
    if (minus && e.shiftKey) {
      e.preventDefault()
      scaleScene(-1)
    }
    if (plus && e.shiftKey) {
      e.preventDefault()
      scaleScene(1)
    }
    if (arrowLeft && arrowLeft !== controller.value.arrowLeft) {
      initController('arrowLeft')
    }
    if (arrowRight && arrowRight !== controller.value.arrowRight) {
      initController('arrowRight')
    }
    if (arrowUp && arrowUp !== controller.value.arrowUp) {
      initController('arrowUp')
    }
    if (arrowDown && arrowDown !== controller.value.arrowDown) {
      initController('arrowDown')
    }
  }
  window.addEventListener('keydown', keydownEventListener.value)
  // Handle keyup events
  keyupEventListener.value = e => {
    const key = e.key
    const code = e.code
    const keyCode = e.keyCode
    if (key === 'ArrowLeft' || code === 'ArrowLeft' || keyCode === 37) {
      controller.value.arrowLeft = false
    }
    if (key === 'ArrowRight' || code === 'ArrowRight' || keyCode === 39) {
      controller.value.arrowRight = false
    }
    if (key === 'ArrowUp' || code === 'ArrowUp' || keyCode === 38) {    
      controller.value.arrowUp = false
    }
    if (key === 'ArrowDown' || code === 'ArrowDown' || keyCode === 40) {
      controller.value.arrowDown = false
    }
  }
  window.addEventListener('keyup', keyupEventListener.value)
})

onBeforeUnmount(() => {
  loadedIds.value = []
  window.removeEventListener('resize', resizeEventListener.value)
  window.removeEventListener('keydown', keydownEventListener.value)
  window.removeEventListener('keyup', keyupEventListener.value)
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
