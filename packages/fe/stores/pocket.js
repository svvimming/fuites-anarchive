// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
export const usePocketStore = defineStore('pocket', () => {
  // ==================================================================== import
  const toasterStore = useToasterStore()
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
  const uploaders = ref({})
  const pocketOpen = ref(false)
  const fullscreen = ref(false)
  
  // ================================================================== Computed
  const thingies = computed(() => pocket.value?.data.thingies || [])
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
      console.log('register uploader')
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
      const response = await useFetchAuth('/authenticate-pocket', { method: 'get', token, verse: verse.value.data?.name })
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
   * @method postUpdatePocket
   */

  // const postUpdatePocket = async incoming => {
  //   try {
  //     const thingie = incoming.thingie
  //     const action = incoming.action
  //     if (action && token.value === thingie.last_update_token) {
  //       let updated = []
  //       // Add a thingie to the pocket
  //       if (action === 'add') {
  //         if (!thingies.value.includes(thingie._id)) {
  //           updated = [thingie._id].concat(thingies.value)
  //         } else {
  //           throw 'this thingie is already in the pocket!'
  //         }
  //       }
  //       // Remove a thingie from the pocket
  //       if (action === 'remove') {
  //         if (thingies.value.includes(thingie._id)) {
  //           updated = thingies.value.filter(id => id !== thingie._id)
  //         } else {
  //           throw 'tried to remove a thingie not in the pocket!'
  //         }
  //       }
  //       const response = await useFetchAuth('/post-update-pocket', { token: token.value, thingies: updated  })
  //       pocket.value = response
  //     }
  //   } catch (e) {
  //     useHandleFetchError(e, 'use-pocket-store:post-update-pocket')
  //   }
  // }

  // ==================================================================== return
  return {
    // ----- state
    pocket,
    uploaders,
    pocketOpen,
    fullscreen,
    // ----- computed
    token,
    thingies,
    authenticated,
    // ----- actions
    setPocketOpen,
    registerUploader,
    toggleUploaderOpen,
    setUploader,
    togglePocketFullscreen,
    getAuthPocket
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePocketStore, import.meta.hot))
}
