// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
export const usePocketStore = defineStore('pocket', () => {
  // ==================================================================== import
  const toasterStore = useToasterStore()

  // ===================================================================== state
  const pocket = ref({
    loading: false,
    refresh: false,
    authenticated: false,
    data: {
      _id: '',
      token: '',
      verses: []
    }
  })
  const uploaders = ref({})
  const pocketOpen = ref(false)
  const fullscreen = ref(false)
  
  // ================================================================== Computed
  const token = computed(() => pocket.value?.data.token)
  const authenticated = computed(() => pocket.value.authenticated)
  
  // =================================================================== actions

  /**
   * @method setPocketOpen
   */

  const setPocketOpen = val => {
    pocketOpen.value = val
  }

  /**
   * @method registerUploader
   */

  const registerUploader = id => {
    const uploaderExists = uploaders.value[id]
    if (!uploaderExists) {
      uploaders.value[id] = {
        status: 'idle', // 'idle', 'initializing', 'ready', 'uploading', 'upload-complete'
        file: false,
        open: false,
        id
      }
    }
  }

  /**
   * @method toggleUploaderOpen
   */

  const toggleUploaderOpen = incoming => {
    const id = incoming.id
    if (uploaders.value[id]) {
      uploaders.value[id].open = incoming.hasOwnProperty('newValue') ? incoming.newValue : !uploaders.value[id].open
    }
  }

  /**
   * @method setUploader
   */

  const setUploader = incoming => {
    const id = incoming.id
    if (uploaders.value[id]) {
      uploaders.value[id] = Object.assign({}, uploaders.value[id], incoming)
    }
  }

  /**
   * @method togglePocketFullscreen
   */

  const togglePocketFullscreen = () => {
    fullscreen.value = !fullscreen.value
  }

  /**
   * @method getAuthPocket
   */

  const getAuthPocket = async token => {
    try {
      const response = await useFetchAuth('/authenticate-pocket', { method: 'get', token })
      toasterStore.addMessage({ type: 'success', text: '💫 💫 💫' })
      useSetStoreData(pocket, {
        loading: false,
        refresh: false,
        authenticated: true,
        data: response
      })
    } catch (e) {
      toasterStore.addMessage({ type: 'error', text: 'Oops, try another token' })
      useHandleFetchError(e)
      useSetStoreData(pocket, {
        loading: false,
        refresh: false,
        authenticated: false,
        data: {
          _id: '',
          token: '',
          verses: []
        }
      })
    }
  }

  /**
   * @method postCreateVerse
   */

  const postCreateVerse = async incoming => {
    try {
      useSetStoreData(pocket, { refresh: true })
      const response = await useFetchAuth('/post-create-verse', Object.assign({}, {
        verseName: incoming.verseName,
        firstPageName: incoming.firstPageName,
        pocketId: pocket.value.data._id,
        method: 'post'
      }))
      useSetStoreData(pocket, {
        loading: false,
        refresh: false,
        authenticated: true,
        data: response
      })
      return pocket
    } catch (e) {
      useHandleFetchError(e)
      useSetStoreData(pocket, { refresh: false })
      return false
    }
  }

  // ==================================================================== return
  return {
    // ----- state
    pocket,
    uploaders,
    pocketOpen,
    fullscreen,
    // ----- computed
    token,
    authenticated,
    // ----- actions
    setPocketOpen,
    registerUploader,
    toggleUploaderOpen,
    setUploader,
    togglePocketFullscreen,
    getAuthPocket,
    postCreateVerse
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePocketStore, import.meta.hot))
}
