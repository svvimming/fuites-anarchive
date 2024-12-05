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
  const { baseUrl, draggingThingie } = storeToRefs(generalStore)
  const verseStore = useVerseStore()
  const { page } = storeToRefs(verseStore)
  const collectorStore = useCollectorStore()
  const { thingies } = storeToRefs(collectorStore)

  const handleOffset = ref({ x: 0, y: 0 })
  const { x, y } = useMouse({ type: 'client' })
  const { element: target } = useElementByPoint({ x, y })

  // =================================================================== Methods
  /**
   * @method handleDragStart
   */

  const handleDragStart = e => {
    const origin = e.target.getBoundingClientRect()
    const coords = { x: e.clientX - origin.x, y: e.clientY - origin.y }
    const stage = stageRef.value.getStage()
    const hit = stage.getIntersection(coords)
    const id = hit?.attrs.thingie_id || hit?.parent?.attrs.thingie_id
    const thingie = thingies.value.data.find(item => item._id === id)
    if (thingie) {
      // Set a custom ghost image
      const ghost = document.createElement('img')
      ghost.dataset.thingieId = thingie._id
      ghost.classList.add('ghost-image')
      ghost.src = `${baseUrl.value}/${thingie.file_ref._id}.${thingie.file_ref.file_ext}`
      ghost.style = `width: ${thingie.at.width}px; height: ${thingie.at.height}px; padding-top: unset;`
      document.body.appendChild(ghost)
      handleOffset.value = ({
        x: e.clientX - origin.x - thingie.at.x,
        y: e.clientY - origin.y - thingie.at.y,
      })
      e.dataTransfer.setDragImage(ghost, handleOffset.value.x + thingie.at.width * 0.5, handleOffset.value.y + thingie.at.height * 0.5)
      generalStore.setDraggingThingie(thingie)
    } else {
      e.preventDefault()
    }
  }

  /**
   * @method handleDragEnd
   */

  const handleDragEnd = e => {
    e.preventDefault()
    generalStore.setDragndrop(false)
    const targetLocation = target.value.parentNode.parentNode.parentNode.dataset.location || target.value.parentNode.parentNode.dataset.location
    const dropLocations = ['pocket', 'compost', page.value.data?.name]
    const thingie = draggingThingie.value
    if (
      targetLocation &&
      dropLocations.includes(targetLocation) &&
      targetLocation !== thingie.location
    ) {
      const coords = { x: e.clientX - handleOffset.value.x, y: e.clientY - handleOffset.value.y }
      if (targetLocation === 'pocket') {
        const pocket = document.getElementById('pocket')
        const rect = pocket.getBoundingClientRect()
        coords.x = coords.x - rect.x
        coords.y = coords.y - rect.y
      }
      const at = Object.assign({}, thingie.at, coords)
      collectorStore.initThingieUpdate({
        _id: thingie._id,
        location: targetLocation,
        record_new_location: true,
        at
      }, true)
    }
    // Remove custom ghost image
    const ghost = document.querySelector(`.ghost-image[data-thingie-id="${draggingThingie.value?._id}"]`)
    document.body.removeChild(ghost)
  }

  /**
   * @method handleDragOver
   */

  const handleDragOver = e => { e.preventDefault() }

  /**
   * @method handleDrop
   */

  const handleDrop = e => { e.preventDefault() }

  // ===================================================================== Hooks
  onMounted(() => {
    nextTick(() => {
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
