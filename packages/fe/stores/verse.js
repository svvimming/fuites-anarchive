// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
export const useVerseStore = defineStore('verse', () => {
  // ===================================================================== state
  const verse = ref({
    loading: false,
    refresh: false,
    data: {}
  })

  const page = ref({
    loading: false,
    refresh: false,
    data: {}
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
      const response = await useFetchAuth('/get-page', { verse: incoming.verse || verse.value.data.name, page: incoming.page, method: 'get' })
      useSetStoreData(page, {
        loading: false,
        refresh: false,
        data: response
      })
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
    updateSceneData,
    setTextEditor,
    setColorSelectorHex
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useVerseStore, import.meta.hot))
}
