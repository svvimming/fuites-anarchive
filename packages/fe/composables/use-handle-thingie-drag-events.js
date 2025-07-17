// ////////////////////////////////////////////////////////////////////// Import
// -----------------------------------------------------------------------------
import { useElementByPoint, useMouse } from '@vueuse/core'

// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
export const useHandleThingieDragEvents = (element, stageRef) => {
  // ====================================================================== Data
  const dragstartEventListener = ref(false)
  const dragendEventListener = ref(false)
  const dragoverEventListener = ref(false)
  const dropEventListener = ref(false)
  const generalStore = useGeneralStore()
  const { draggingThingie } = storeToRefs(generalStore)
  const verseStore = useVerseStore()
  const { page, sceneData } = storeToRefs(verseStore)
  const collectorStore = useCollectorStore()
  const { thingies } = storeToRefs(collectorStore)
  const pocketStore = usePocketStore()
  const { pocket, authenticated } = storeToRefs(pocketStore)

  const handleOffset = ref({ x: 0, y: 0 })
  const { x, y } = useMouse({ type: 'client' })
  const { element: target } = useElementByPoint({ x, y })

  // =================================================================== Methods
  /**
   * @method handleDragStart
   */

  const handleDragStart = e => {
    if (authenticated.value) {
      const origin = e.target.getBoundingClientRect()
      const coords = { x: e.clientX - origin.x, y: e.clientY - origin.y }
      const stage = stageRef.value.getStage()
      const hit = stage.getIntersection(coords)
      const id = hit?.attrs.thingie_id || hit?.parent?.attrs.thingie_id
      const thingie = thingies.value.data.find(item => item._id === id)
      if (hit && thingie) {
        // Make handle offset measurement calculations
        const from = e.target.dataset.location
        if (from !== 'pocket') {
          handleOffset.value.x = e.clientX - origin.x - (thingie.at.x * sceneData.value.scale) - (sceneData.value.x * sceneData.value.scale)
          handleOffset.value.y = e.clientY - origin.y - (thingie.at.y * sceneData.value.scale) - (sceneData.value.y * sceneData.value.scale)
        } else {
          handleOffset.value.x = e.clientX - origin.x - thingie.at.x
          handleOffset.value.y = e.clientY - origin.y - thingie.at.y
        }
        // Set the thingie as dragging
        generalStore.setDraggingThingie(thingie)
        // Handle creating a ghost image for dragging
        const dataUrl = hit.toDataURL({ mimeType: 'image/png', pixelRatio: 1 })
        const ghost = document.createElement('img')
        ghost.crossOrigin = 'anonymous'
        ghost.src = dataUrl
        ghost.dataset.thingieId = thingie._id
        ghost.classList.add('ghost-image')
        ghost.style = `width: ${thingie.at.width}px; height: ${thingie.at.height}px; padding-top: unset;`
        document.body.appendChild(ghost)
        e.dataTransfer.setDragImage(ghost, thingie.at.width * 0.5, thingie.at.height * 0.5)
      } else {
        e.preventDefault()
      }
    }
  }

  /**
   * @method handleDragEnd
   */

  const handleDragEnd = e => {
    e.preventDefault()
    if (authenticated.value) {
      // Set global drag n drop boolean to false
      generalStore.setDragndrop(false)
      // Get the location of the canvas being dropped onto
      const targetLocation = target.value.parentNode.parentNode.parentNode.dataset.location || target.value.parentNode.parentNode.dataset.location
      const dropLocations = ['pocket', 'compost', page.value.data?.name]
      const thingie = draggingThingie.value
      if (
        targetLocation &&
        dropLocations.includes(targetLocation) &&
        targetLocation !== thingie.location
      ) {
        // Calculate dropped thingie new position based on drop coords
        let coords
        if (targetLocation === 'pocket') {
          const pocket = document.getElementById('pocket-canvas')
          const rect = pocket.getBoundingClientRect()
          coords = { x: e.clientX - handleOffset.value.x - rect.x, y: e.clientY - handleOffset.value.y - rect.y }
        } else {
          coords = { x: (e.clientX / sceneData.value.scale) - sceneData.value.x, y: (e.clientY / sceneData.value.scale) - sceneData.value.y }
        }
        // Update thingie
        const at = Object.assign({}, thingie.at, coords)
        collectorStore.initThingieUpdate({
          _id: thingie._id,
          location: targetLocation,
          record_new_location: true,
          at,
          ...(targetLocation === 'pocket' && { pocket_ref: pocket.value.data._id })
        }, true)
        handleOffset.value = { x: 0, y: 0 }
        // If the page being dropped onto is metastable, trigger a tip
        if (page.value.data?.state === 'metastable' && !['pocket', 'compost'].includes(targetLocation)) {
          createNewPageFromThingie(thingie, at)
        }
      }
      // Remove custom ghost image
      const ghost = document.querySelector(`.ghost-image[data-thingie-id="${draggingThingie.value?._id}"]`)
      document.body.removeChild(ghost)
      // Reset dragging thingie
      generalStore.setDraggingThingie(false)
    }
  }

  /**
   * @method handleDragOver
   */

  const handleDragOver = e => { e.preventDefault() }

  /**
   * @method handleDrop
   */

  const handleDrop = e => { e.preventDefault() }

  /**
   * @method createNewPageFromThingie
   */

  const createNewPageFromThingie = async (thingie, newAt) => {
    const created = await verseStore.postCreatePage({
      initiatorPocket: pocket.value.data._id,
      creatorThingie: thingie,
      overflowPage: page.value.data.name
    })
    if (created) {
      collectorStore.initThingieUpdate({
        _id: thingie._id,
        location: created.name,
        record_new_location: true,
        at: newAt
      }, true)
      // Navigate to new page
      const newRoute = `/${created.verse}/${created.name}`
      await navigateTo({ path: newRoute })
    }
  }


  // ===================================================================== Hooks
  onMounted(() => {
    nextTick(() => {
      if (!element.value) return
      dragstartEventListener.value = e => { handleDragStart(e) }
      dragendEventListener.value = e => { handleDragEnd(e) }
      dragoverEventListener.value = e => { handleDragOver(e) }
      dropEventListener.value = e => { handleDrop(e) }
      element.value.addEventListener('dragstart', dragstartEventListener.value)
      element.value.addEventListener('dragend', dragendEventListener.value)
      element.value.addEventListener('dragover', dragoverEventListener.value)
      element.value.addEventListener('drop', dropEventListener.value)
    })
  })
}
