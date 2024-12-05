// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
export const useSaveCanvasExport = stageRef => {
  // ====================================================================== Data
  const websocketStore = useWebsocketStore()
  const { socket } = storeToRefs(websocketStore)
  const verseStore = useVerseStore()
  const { verse, page } = storeToRefs(verseStore)

  const fileReader = ref(false)
  const blob = ref(false)
  const blobId = ref('')
  const place = ref(0)
  const goal = ref(0)
  const nextChunkPayload = ref(false)

  const { $bus } = useNuxtApp()
  // const progress = ref(0)

  // ================================================================== Computed
  const stage = computed(() => stageRef.value?.getNode())
  const exportReady = computed(() => stage.value && socket.value)
  const blobsize = computed(() => blob.value?.size)
  const mimetype = computed(() => blob.value?.type)

  // ================================================================== Watchers
  watch(exportReady, (val) => {
    if (val) {
      setTimeout(() => {
        stage.value.toBlob({
          callback: (data) => {
            blob.value = data
            uploadPrint()
          },
          type: 'image/png',
          quality: 1.0
        })
      }, 2000)
    }
  })

  // =================================================================== Methods
  /**
   * @method uploadPrint
   */

  const uploadPrint = () => {
    if (blob.value) {
      socket.value.emit('module|print-upload-initialize|payload', {
        socket_id: socket.value.id,
        page: page.value.data.name,
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
    console.log('upload next chunk')
    if (!blobId.value) {
      blobId.value = data.file_id
    }
    place.value = data.place
    goal.value = data.goal
    const chunksize = data.chunksize
    const index = place.value * chunksize
    const chunk = blob.value.slice(index, index + Math.min(chunksize, (blobsize.value - index)), mimetype.value)
    // progress.value = ((place.value / goal.value) * 100).toFixed(0)
    nextChunkPayload.value = {
      socket_id: socket.value.id,
      file_id: blobId.value,
      file_ext: data.file_ext,
      place: place.value,
      goal: goal.value
    }
    fileReader.value.readAsArrayBuffer(chunk)
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
    // websocket.on('module|print-upload-complete|payload', fileUploadComplete)
  }

  // ===================================================================== Hooks
  $bus.$on('socket.io-connected', handleWebsocketConnected)

  onBeforeUnmount(() => {
    $bus.$off('socket.io-connected', handleWebsocketConnected)
  })
}
