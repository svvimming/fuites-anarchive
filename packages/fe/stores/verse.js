// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
export const useVerseStore = defineStore('verse', () => {
  // ==================================================================== import
  const alertStore = useZeroAlertStore()

  // ===================================================================== state
  const verse = ref({
    loading: false,
    refresh: false,
    data: {}
  })

  const page = ref({
    loading: false,
    refresh: false,
    data: null
  })

  const sceneData = ref({
    x: 0,
    y: 0,
    scale: 1
  })

  const textEditor = ref(false)
  const colorSelectorHex = ref('')

  // =================================================================== actions

  /**
   * @method getVerse
   */

  const getVerse = async incoming => {
    try {
      useSetStoreData(verse, { loading: true })
      const response = await useFetchAuth('/get-verse', { verse: incoming.verse, method: 'get' })
      useSetStoreData(verse, {
        loading: false,
        refresh: false,
        data: response
      })
    } catch (e) {
      useHandleFetchError(e)
      useSetStoreData(verse, {
        loading: false,
        refresh: false,
        data: {}
      })
    }
  }

  /**
   * @method getPage
   */

  const getPage = async incoming => {
    try {
      useSetStoreData(page, { loading: true })
      const response = await useFetchAuth('/get-page', { verse: incoming.verse || verse.value.data.name, page: incoming.page, method: 'get' })
      useSetStoreData(page, {
        loading: false,
        refresh: false,
        data: response || { doesNotExist: true }
      })
      // If no page is found, open the 'new page' modal to create a new page from this route
      if (!response) {
        alertStore.openAlert('page-creator-alert')
      }
    } catch (e) {
      useHandleFetchError(e)
      useSetStoreData(page, {
        loading: false,
        refresh: false,
        data: {}
      })
    }
  }

  /**
   * @method updatePage
   */

  const updatePage = incoming => {
    if (incoming.name === page.value.data.name) {
      page.value.data = incoming
    }
  }

  /**
   * @method postCreatePage
   */

  const postCreatePage = async incoming => {
    try {
      useSetStoreData(page, { refresh: true })
      const newPage = await useFetchAuth('/post-create-page', Object.assign({}, incoming, {
        verse: verse.value.data.name,
        method: 'post'
      }))
      useSetStoreData(page, {
        refresh: false,
        data: newPage
      })
      return newPage
    } catch (e) {
      useHandleFetchError(e)
      useSetStoreData(page, { refresh: false })
      return false
    }
  }

  /**
   * @method updateSceneData
   */

  const updateSceneData = incoming => {
    sceneData.value = Object.assign({}, sceneData.value, incoming)
  }

  /**
   * @method setTextEditor
   */

  const setTextEditor = incoming => {
    textEditor.value = incoming
  }

  /**
   * @method setColorSelectorHex
   */

  const setColorSelectorHex = incoming => {
    colorSelectorHex.value = incoming
  }

  // ==================================================================== return
  return {
    // ----- state
    verse,
    page,
    sceneData,
    textEditor,
    colorSelectorHex,
    // ----- actions
    getVerse,
    getPage,
    updatePage,
    postCreatePage,
    updateSceneData,
    setTextEditor,
    setColorSelectorHex
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useVerseStore, import.meta.hot))
}
