// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
export const usePocketStore = defineStore('pocket', () => {
  // ==================================================================== import
  const toasterStore = useToasterStore()
  const generalStore = useGeneralStore()
  const { activeModes } = storeToRefs(generalStore)
  const verseStore = useVerseStore()
  const { verse } = storeToRefs(verseStore)

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
  const invite = ref({
    loading: false,
    refresh: false,
    data: {}
  })
  const uploaders = ref({})
  const pocketOpen = ref(false)
  const fullscreen = ref(false)
  const drippy = ref(0)
  
  // ================================================================== Computed
  const token = computed(() => pocket.value?.data.token)
  const authenticated = computed(() => pocket.value.authenticated && pocket.value.data.verses.some(item => item._id === verse.value.data._id))
  
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
   * @method setDrippyScene
   */

  const setDrippyScene = scene => {
    drippy.value = scene
  }

  /**
   * @method getAuthPocket
   */

  const getAuthPocket = async incoming => {
    try {
      useSetStoreData(pocket, { loading: true })
      const response = await useFetchAuth('/authenticate-pocket', {
        method: 'get',
        token: incoming.token,
        localStorageAuth: incoming.localStorageAuth
      })
      // If auth is successful
      if (response.pocket) {
        // Add a toaster message if manually entered token is retrieved
        if (response.type === 'manual-auth-success') {
          toasterStore.addMessage({ type: 'success', text: '💫 💫 💫' })
          // Set first time landing (ftu)
          const authCount = response.pocket.manualAuthCount
          if (typeof authCount === 'number' && authCount < 3) {
            setDrippyScene(1)
            setPocketOpen(false)
            if (!activeModes.value.tooltips) {
              generalStore.toggleMode('tooltips')
            }
          }
        }
        // Set the pocket data
        useSetStoreData(pocket, {
          loading: false,
          refresh: false,
          authenticated: true,
          data: response.pocket
        })
        // Turn off external links mode if auth is successful
        generalStore.setMode('externalLinks', false)
      } else { // If auth is not successful
        if (response.type === 'token-not-found') {
          // If token is not found (manual submission)
          toasterStore.addMessage({ type: 'error', text: 'Oops, try another token' })
        }
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
        // Turn on external links mode if auth is not successful
        generalStore.setMode('externalLinks', true)
      }
    } catch (e) {
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

  /**
   * @method checkTokenExists
   * @desc Checks if the supplied token exists in the database
   * @param {String} token - The token to check
   * @returns {Boolean} - True if token exists, false otherwise
   */
  
  const checkTokenExists = async token => {
    try {
      const result = await useFetchAuth('/check-token-exists', { token, method: 'get' })
      return result
    } catch (e) {
      useHandleFetchError(e)
      return false
    }
  }

  /**
   * @method postAddVerseToToken
   */

  const postAddVerseToToken = async incoming => {
    try {
      const response = await useFetchAuth('/post-add-token-verse', Object.assign({}, incoming, {
        method: 'post'
      }))
      return response
    } catch (e) {
      useHandleFetchError(e)
      return false
    }
  }

  /**
   * @method postGenerateInvite
   */

  const postGenerateInvite = async incoming => {
    try {
      const response = await useFetchAuth('/post-generate-invite', Object.assign({}, incoming, {
        generate_allowed: false,
        created_by: token.value,
        hashed: true,
        method: 'post'
      }))
      return response
    } catch (e) {
      useHandleFetchError(e)
      return false
    }
  }

  /**
   * @method getInvite
   */

  const getInvite = async incoming => {
    try {
      useSetStoreData(invite, { loading: true })
      const response = await useFetchAuth('/get-invite', Object.assign({}, incoming, {
        method: 'get'
      }))
      useSetStoreData(invite, {
        loading: false,
        refresh: false,
        data: response
      })
    } catch (e) {
      useHandleFetchError(e)
      useSetStoreData(invite, {
        loading: false,
        refresh: false,
        data: {}
      })
    }
  }

  /**
   * @method postAcceptInvite
   */

  const postAcceptInvite = async incoming => {
    const type = incoming.submit_type
    try {
      let response = false
      if (type === 'add-token') {
        console.log(incoming)
        response = await useFetchAuth('/post-accept-invite', Object.assign({}, incoming, {
          method: 'post'
        }))
        console.log(response)
      } else if (type === 'generate-token') {
        response = await useFetchAuth('/post-create-pocket', Object.assign({}, incoming, {
          method: 'post'
        }))
      }
      return response
    } catch (e) {
      useHandleFetchError(e)
      return false
    }
  }

  // ==================================================================== return
  return {
    // ----- state
    pocket,
    invite,
    uploaders,
    pocketOpen,
    fullscreen,
    drippy,
    // ----- computed
    token,
    authenticated,
    // ----- actions
    setPocketOpen,
    registerUploader,
    toggleUploaderOpen,
    setUploader,
    togglePocketFullscreen,
    setDrippyScene,
    getAuthPocket,
    postCreateVerse,
    checkTokenExists,
    postAddVerseToToken,
    postGenerateInvite,
    getInvite,
    postAcceptInvite
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePocketStore, import.meta.hot))
}
