// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
import { useFilterDuplicatePortals } from '../composables/use-filter-duplicate-portals.js'

// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
export const useVerseStore = defineStore('verse', () => {
  // ==================================================================== import
  const alertStore = useZeroAlertStore()
  const generalStore = useGeneralStore()
  const { sessionId } = storeToRefs(generalStore)
  const websocketStore = useWebsocketStore()
  const { socket } = storeToRefs(websocketStore)

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
    initialized: false,
    x: 0,
    y: 0,
    scale: 1
  })

  const textEditor = ref(false)
  const portalCreatorOpen = ref(false)
  const portalToDelete = ref(false)
  const colorSelectorHex = ref({
    text: '',
    sound: ''
  })

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
      return true
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
        response.filtered_portals = await useFilterDuplicatePortals(response.portal_refs)
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

  const updatePage = async incoming => {
    if (incoming.name === page.value.data.name && incoming.verse === verse.value.data.name) {
      // Add filtered portals to incoming page
      incoming.filtered_portals = await useFilterDuplicatePortals(incoming.portal_refs)
      useSetStoreData(page, {
        loading: false,
        refresh: false,
        data: incoming
      })
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
    Object.assign(colorSelectorHex.value, incoming)
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
   * @method setPortalToDelete
   */

  const setPortalToDelete = incoming => {
    portalToDelete.value = incoming
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
   * @method checkVerseExists
   * @desc Checks if a verse with the given name already exists
   * @param {String} verseName - The name of the verse to check
   * @returns {Boolean} - True if verse exists, false otherwise
   */
  
  const checkVerseExists = async verseName => {
    try {
      const result = await useFetchAuth('/get-verse', { verse: verseName, method: 'get' })
      return !!result
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

  /**
   * @method postDeletePortal
   */

  const postDeletePortal = async () => {
    try {
      if (portalToDelete.value) {
        useSetStoreData(page, { refresh: true })
        await useFetchAuth('/post-delete-portal', {
          portalId: portalToDelete.value,
          verse: verse.value.data.name,
          method: 'post'
        })
        useSetStoreData(page, { refresh: false })
      }
    } catch (e) {
      useHandleFetchError(e)
      useSetStoreData(page, { refresh: false })
    }
  }

  /**
   * @method initPortalUpdate
   */

  const initPortalUpdate = async incoming => {
    // Broadcast the update to db and other clients
    socket.value.emit('update-portal', Object.assign({}, incoming, {
      omit_session_id: sessionId.value,
    }))
    // Update the store
    const index = page.value.data.filtered_portals.findIndex(p => p._id === incoming._id)
    if (index > -1) {
      page.value.data.filtered_portals[index].vertices = incoming.vertices
    }
  }

  /**
   * @method updatePortal
   * Update the a portal in the store: Called only when broadcast from other clients via the server
   */

  const updatePortal = async incoming => {
    const index = page.value.data.filtered_portals.findIndex(p => p._id === incoming._id)
    if (index > -1) {
      page.value.data.filtered_portals[index] = incoming
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
    portalToDelete,
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
    setPortalToDelete,
    checkPageExists,
    checkVerseExists,
    postCreatePortal,
    postDeletePortal,
    initPortalUpdate,
    updatePortal
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useVerseStore, import.meta.hot))
}
