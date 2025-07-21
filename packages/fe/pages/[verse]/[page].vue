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
          @mousedown="handleMouseDown($event)"
          @mousemove="handleMouseMove($event)"
          @mouseup="handleMouseUp($event)"
          @mouseleave="handleMouseLeave($event)"
          @touchstart="handleTouchStart($event)"
          @touchmove="handleTouchMove($event)"
          @touchend="handleTouchEnd($event)">
          <v-layer ref="layerRef" :config="initLayer">

            <Thingie
              v-for="thingie in pageThingies"
              :key="thingie._id"
              :thingie="thingie"
              @record-load="handleRecordLoad" />

            <RecordingPath />

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
const { thingies, editing, mobileDragThingie } = storeToRefs(collectorStore)
const generalStore = useGeneralStore()
const { dragndrop, small, activeModes, mouseOverScene } = storeToRefs(generalStore)
const pocketStore = usePocketStore()
const { authenticated } = storeToRefs(pocketStore)
const mixerStore = useMixerStore()
const { recording } = storeToRefs(mixerStore)

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
const touchLast = ref({ x: 0, y: 0 })
const lastTouchDistance = ref(0)
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
    initPageshot({ destination: 'server' })
  }
}, { deep: true })

// position scene to center on editing thingie on mobile devices
watch(editing, id => {
  if (small.value && id) {
    const editingData = thingies.value.data.find(item => item._id === id)
    if (editingData && editingData.location !== 'pocket') {
      const at = editingData.at
      const hw = (window.innerWidth * 0.5) / sceneData.value.scale
      const hh = (window.innerHeight * 0.366) / sceneData.value.scale
      positionScene({
        x: -1 * at.x + hw,
        y: -1 * at.y + hh
      })
    }
  }
})

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
  if (authenticated.value && !activeModes.value.record) {
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
  if (authenticated.value && target.attrs.hasOwnProperty('id') && target.attrs.id === 'page-canvas' && !activeModes.value.record) {
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
 * @method handleMouseDown
 * @desc Records mouse coordinates when record mode is enabled
 */

const handleMouseDown = e => {
  if (activeModes.value.record) {
    const stage = stageRef.value.getNode()
    const point = stage.getPointerPosition()
    const layer = layerRef.value.getNode()
    const scale = stage.scaleX()
    
    // Convert coordinates to account for layer position and scale
    const x = (point.x - layer.x()) / scale
    const y = (point.y - layer.y()) / scale
    
    // Add coordinates to recording path using the mixer store method
    mixerStore.addToRecordingPath(x, y)
    // Set recording state to recording
    mixerStore.setRecordingState('recording')
  }
}

/**
 * @method handleMouseMove
 */

const handleMouseMove = useThrottleFn(e => {
  const attrs = e.target.attrs
  const type = attrs.hasOwnProperty('thingie_id') ?
                'thingie' :
                attrs.hasOwnProperty('portal_id') ?
                  'portal' :
                  attrs.id === 'page-canvas' ?
                    'canvas' : false
  const mouseOver = mouseOverScene.value

  // Handle recording path coordinates
  if (activeModes.value.record && recording.value.state === 'recording') {
    const stage = stageRef.value.getNode()
    const point = stage.getPointerPosition()
    const layer = layerRef.value.getNode()
    const scale = stage.scaleX()
    
    // Convert coordinates to account for layer position and scale
    const x = (point.x - layer.x()) / scale
    const y = (point.y - layer.y()) / scale
    
    // Add coordinates to recording path
    mixerStore.addToRecordingPath(x, y)
  }

  // Handle mouse over scene state
  if (!type && mouseOver) {
    generalStore.setMouseOverScene(false)
  } else if (type === 'canvas' && mouseOver?.type !== 'canvas') {
    generalStore.setMouseOverScene({ type: 'canvas', attrs })
  } else if (type === 'thingie' && mouseOver?.attrs?.thingie_id !== attrs.thingie_id) {
    generalStore.setMouseOverScene({ type: 'thingie', attrs })
  } else if (type === 'portal' && mouseOver?.attrs?.portal_id !== attrs.portal_id) {
    generalStore.setMouseOverScene({ type: 'portal', attrs })
  }
}, 10)

/**
 * @method handleMouseUp
 * @desc Completes the recording when mouse is released
 */

const handleMouseUp = e => {
  if (recording.value.state === 'recording') {
    mixerStore.setRecordingState('complete')
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
 * @method handleTouchStart
 */

const handleTouchStart = e => {
  if (!activeModes.value.mobileEdit) {
    const touchPoints = e.evt.touches
    const touchPoint1 = touchPoints[0]
    touchLast.value = { x: touchPoint1.clientX, y: touchPoint1.clientY }
  }
}

/**
 * @method handleTouchMove
 */

const handleTouchMove = e => {
  if (!activeModes.value.mobileEdit) {
    e.evt.preventDefault()
    const layer = layerRef.value.getNode()
    const touchPoints = e.evt.touches
    const touch1 = touchPoints[0]
    const touch2 = touchPoints[1]
    if (touch1 && touch2) {
      const p1 = { x: touch1.clientX, y: touch1.clientY }
      const p2 = { x: touch2.clientX, y: touch2.clientY }
      // Calculate distance between touch points
      const distance = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2)
      if (!lastTouchDistance.value) {
        lastTouchDistance.value = distance
        return
      }
      // Handle scaling
      const delta = distance - lastTouchDistance.value
      scaleScene(delta * 0.01)
      lastTouchDistance.value = distance
    } else if (touch1) {
      const deltaX = touchLast.value.x - touch1.clientX
      const deltaY = touchLast.value.y - touch1.clientY
      positionScene({
        x: layer.x() - deltaX,
        y: layer.y() - deltaY
      })
      touchLast.value = { x: touch1.clientX, y: touch1.clientY }
    }
  } else if (e.target.attrs.hasOwnProperty('thingie_id')) {
    if (e.target.attrs.thingie_id !== mobileDragThingie.value) {
      collectorStore.setMobileDragThingie(e.target.attrs.thingie_id)
    }
  } else if (mobileDragThingie.value) {
    collectorStore.setMobileDragThingie(false)
  }
}

/**
 * @method handleTouchEnd
 */

const handleTouchEnd = (e) => {
  lastTouchDistance.value = 0
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

const scaleScene = (delta = 0) => {
  const stage = stageRef.value.getNode()
  const layer = layerRef.value.getNode()
  const limits = bounds.value
  const oldScale = stage.scaleX()
  const canvasCenter = {
    x: stage.width() * 0.5,
    y: stage.height() * 0.5
  }
  const zoomCenter = {
    x: (canvasCenter.x - stage.x()) / oldScale,
    y: (canvasCenter.y - stage.y()) / oldScale
  }
  const ratio = oldScale * (1 + delta)
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
  // Add no-scroll class to body
  document.body.classList.add('no-scroll')
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
    nextTick(() => { scaleScene(0) })
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
    const print = e.key === 'p' || e.code === 'KeyP' || e.keyCode === 80
    // Handle zooming
    if (minus && e.shiftKey) {
      e.preventDefault()
      scaleScene(-0.01)
    }
    if (plus && e.shiftKey) {
      e.preventDefault()
      scaleScene(0.01)
    }
    // Handle panning with arrow keys
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
    // Handle downloading a screenshot of the page
    if (print && e.shiftKey) {
      initPageshot({ destination: 'client' })
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
  if (document.body.classList.contains('no-scroll')) {
    document.body.classList.remove('no-scroll')
  }
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
