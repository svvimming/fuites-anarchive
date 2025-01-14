// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
export const usePageshotBot = stageRef => {
  // ====================================================================== Data
  const websocketStore = useWebsocketStore()
  const { socket } = storeToRefs(websocketStore)
  const verseStore = useVerseStore()
  const { verse, page } = storeToRefs(verseStore)

  const fileReader = ref(false)
  const blob = ref(false)
  const printId = ref('')
  const place = ref(0)
  const goal = ref(0)
  const cloned = ref(null)
  const status = ref('ready')
  const nextChunkPayload = ref(false)
  const { $bus } = useNuxtApp()

  // ================================================================== Computed
  const stage = computed(() => stageRef.value?.getNode())
  const blobsize = computed(() => blob.value?.size)
  const mimetype = computed(() => blob.value?.type)

  // =================================================================== Methods
  /**
   * @method initPageshot
   */

  const initPageshot = () => {
    const bounds = page.value?.data.bounds || { x: 2372, y: 2000 }
    // Get the stage layer
    const layers = stage.value.getLayers()
    // Record old scene position
    const pos = layers[0].position()
    // Reposition it at 0,0
    layers[0].position({ x: 0, y: 0 })
    // Clone the stage
    cloned.value = stage.value.clone()
    // Set the canvas to full width / height and scale 1
    cloned.value.width(bounds.x || 2732)
    cloned.value.height(bounds.y || 2000)
    cloned.value.scaleX(1)
    cloned.value.scaleY(1)
    // Return scene to old position
    layers[0].position(pos)
    // Export canvas & initiate upload
    cloned.value.toBlob({
      callback: (data) => { blob.value = data; uploadPrint() },
      type: 'image/png',
      quality: 1.0
    })
  }

  /**
   * @method uploadPrint
   */

  const uploadPrint = () => {
    if (blob.value) {
      socket.value.emit('module|print-upload-initialize|payload', {
        socket_id: socket.value.id,
        page_ref: page.value.data._id,
        filename: `${verse.value.data.name}_${page.value.data.name}_${Date.now()}`,
        filesize: blobsize.value,
        mimetype: mimetype.value
      })
    }
  }

  /**
   * @method uploadNextChunk
   */

  const uploadNextChunk = data => {
    if (!printId.value) {
      printId.value = data.file_id
    }
    place.value = data.place
    goal.value = data.goal
    const chunksize = data.chunksize
    const index = place.value * chunksize
    const chunk = blob.value.slice(index, index + Math.min(chunksize, (blobsize.value - index)), mimetype.value)
    nextChunkPayload.value = {
      socket_id: socket.value.id,
      file_id: printId.value,
      file_ext: data.file_ext,
      place: place.value,
      goal: goal.value
    }
    fileReader.value.readAsArrayBuffer(chunk)
  }

  /**
   * @method fileUploadComplete
   */

  const fileUploadComplete = () => {
    place.value = 0
    nextChunkPayload.value = false
    printId.value = ''
    status.value = 'complete'
    if (cloned.value) {
      cloned.value.destroy()
      cloned.value = null
    }
  }

  /**
   * @method handleWebsocketConnected
   */

  const handleWebsocketConnected = websocket => {
    fileReader.value = new FileReader()
    fileReader.value.onload = (e) => {
      websocket.emit('module|print-upload-chunk|payload', Object.assign(nextChunkPayload.value, { chunk: e.target.result }))
    }
    websocket.on('module|print-upload-chunk|payload', uploadNextChunk)
    websocket.on('module|print-upload-complete|payload', fileUploadComplete)
  }

  /**
   * @method resetUploader
   */

  const resetUploader = () => {
    place.value = 0
    nextChunkPayload.value = false
    printId.value = ''
    status.value = 'ready'
    blob.value = false
    goal.value = 0
    fileReader.value
    if (cloned.value) {
      cloned.value.destroy()
      cloned.value = null
    }
  }

  // ===================================================================== Hooks
  $bus.$on('socket.io-connected', handleWebsocketConnected)

  onBeforeUnmount(() => {
    resetUploader()
    $bus.$off('socket.io-connected', handleWebsocketConnected)
  })

  return { initPageshot, status }
}
