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
  const collectorStore = useCollectorStore()
  const { thingies } = storeToRefs(collectorStore)

  // =================================================================== Methods
  /**
   * @method handleDragStart
   */

  const handleDragStart = e => {
    const target = e.target.getBoundingClientRect()
    const coords = { x: e.clientX - target.x, y: e.clientY - target.y }
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
      e.dataTransfer.setDragImage(ghost, e.clientX - target.x - thingie.at.x, e.clientY - target.y - thingie.at.y)
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
