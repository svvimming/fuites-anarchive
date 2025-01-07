// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
import { useFilterPortals } from '../composables/use-filter-portals.js'

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
  const portalCreatorOpen = ref(false)
  const colorSelectorHex = ref('')

  // =================================================================== actions

  /**
   * @method getVerse
   */

  const getVerse = async incoming => {
    try {
      useSetStoreData(verse, { loading: true })
      const response = await useFetchAuth('/get-verse', { verse: incoming.verse, method: 'get' })
      if (!response) { return false }
      useSetStoreData(verse, {
        loading: false,
        refresh: false,
        data: response
      })
      return response
    } catch (e) {
      useHandleFetchError(e)
      useSetStoreData(verse, {
        loading: false,
        refresh: false,
        data: {}
      })
      return false
    }
  }

  /**
   * @method getPage
   */

  const getPage = async incoming => {
    try {
      useSetStoreData(page, { loading: true })
      const response = await useFetchAuth('/get-page', { verse: incoming.verse || verse.value.data.name, page: incoming.page, method: 'get' })
      // Add filtered portals to response object
      if (response) {
        response.filtered_portals = await useFilterPortals(response.portal_refs)
      }
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
    if (incoming.name === page.value.data.name && incoming.verse === verse.value.data.name) {
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

  /**
   * @method setPortalCreatorOpen
   */

  const setPortalCreatorOpen = e => {
    if (e) {
      portalCreatorOpen.value = { x: e.evt.clientX, y: e.evt.clientY }
    } else {
      portalCreatorOpen.value = false
    }
  }

  /**
   * @method checkPageExists
   */

  const checkPageExists = async incoming => {
    try {
      const result = await useFetchAuth('/get-page', Object.assign({}, incoming, {
        verse: verse.value.data.name,
        method: 'get'
      }))
      return result
    } catch (e) {
      useHandleFetchError(e)
      return false
    }
  }

  /**
   * @method postCreatePortal
   */

  const postCreatePortal = async incoming => {
    try {
      useSetStoreData(page, { refresh: true })
      await useFetchAuth('/post-create-portal', Object.assign({}, incoming, {
        verse: verse.value.data.name,
        verseRef: verse.value.data._id,
        method: 'post'
      }))
      // No need to update page.value.data here because the update page with the
      // new portal comes through the 'module|post-update-page|payload' socket update
      useSetStoreData(page, { refresh: false })
    } catch (e) {
      useHandleFetchError(e)
      useSetStoreData(page, { refresh: false })
    }
  }

  // ==================================================================== return
  return {
    // ----- state
    verse,
    page,
    sceneData,
    textEditor,
    colorSelectorHex,
    portalCreatorOpen,
    // ----- actions
    getVerse,
    getPage,
    updatePage,
    postCreatePage,
    updateSceneData,
    setTextEditor,
    setColorSelectorHex,
    setPortalCreatorOpen,
    checkPageExists,
    postCreatePortal
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useVerseStore, import.meta.hot))
}
