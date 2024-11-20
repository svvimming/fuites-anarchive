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
   * @method updateSceneData
   */

  const updateSceneData = incoming => {
    sceneData.value = Object.assign({}, sceneData.value, incoming)
  }

  // ==================================================================== return
  return {
    // ----- state
    verse,
    page,
    sceneData,
    // ----- actions
    getVerse,
    getPage,
    updateSceneData
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useVerseStore, import.meta.hot))
}
