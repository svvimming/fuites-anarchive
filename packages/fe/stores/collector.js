// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
import { defineStore } from 'pinia'
import { useFetchAuth } from '../composables/use-fetch-auth'

// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
export const useCollectorStore = defineStore('collector', () => {
  // =================================================================== imports
  const generalStore = useGeneralStore()
  const { sessionId, activeModes } = storeToRefs(generalStore)
  const verseStore = useVerseStore()
  const { verse, page, sceneData } = storeToRefs(verseStore)
  const pocketStore = usePocketStore()
  const { pocket, token } = storeToRefs(pocketStore)
  const websocketStore = useWebsocketStore()
  const { socket } = storeToRefs(websocketStore)
  
  // ===================================================================== state
  const thingies = ref({
    loading: false,
    refresh: false,
    data: []
  })

  const editing = ref(false)
  const deleted = ref([])

  // ================================================================== watchers
  watch(() => activeModes.value.mobileEdit, (val) => {
    if (!val) {
      editing.value = false
    }
  })

  // =================================================================== actions

  /**
   * @method getThingies
   */

  const getThingies = async () => {
    try {
      useSetStoreData(thingies, { loading: true })
      const response = await useFetchAuth('/get-thingies', {
        location: page.value.data?.name,
        verse: verse.value.data.name,
        pocketId: pocket.value.data?._id,
        method: 'get'
      })
      useSetStoreData(thingies, {
        loading: false,
        refresh: false,
        data: response
      })
    } catch (e) {
      useHandleFetchError(e)
      useSetStoreData(thingies, {
        loading: false,
        refresh: false,
        data: []
      })
    }
  }

  /**
   * @method postCreateThingie
   */

  const postCreateThingie = async incoming => {
    try {
      useSetStoreData(thingies, { refresh: true })
      const thingie = await useFetchAuth('/post-create-thingie', Object.assign({}, incoming, {
        ...(!incoming.location && { pocket_ref: pocket.value.data._id }),
        creator_token: token.value,
        pocket_ref: pocket.value.data._id,
        verse: verse.value.data.name,
        method: 'post'
      }))
      // No need to add created thingie to thingies.value.data here because
      // it will be added through a socket broadcast - search 'module|post-create-thingie|payload'
      useSetStoreData(thingies, { refresh: false })
      return thingie
    } catch (e) {
      useHandleFetchError(e)
      useSetStoreData(thingies, { refresh: false })
      return false
    }
  }

  /**
   * @method pushCreatedThingie
   */

  const pushCreatedThingie = incoming => {
    if (
      (incoming.location === page.value.data.name || incoming.pocket_ref === pocket.value.data._id) &&
      !thingies.value.data.find(item => item._id === incoming._id)
    ) {
      thingies.value.data.push(incoming)
    }
  }

  /**
   * @method postDeleteThingie
   */

  const postDeleteThingie = async incoming => {
    try {
      useSetStoreData(thingies, { refresh: true })
      const response = await useFetchAuth('/post-delete-thingie', {
        thingieId: incoming._id,
        verse: verse.value.data.name,
        method: 'post'
      })
      // Thingie will be removed from the thingies.value.data array in a socket
      // broadcast - search 'module|post-delete-thingie|payload'
      // But record deleted ID here for the text editor
      if (!deleted.value.includes(response._id)) {
        deleted.value.push(response._id)
      }
      useSetStoreData(thingies, { refresh: false })
      return response
    } catch (e) {
      useHandleFetchError(e)
      useSetStoreData(thingies, { refresh: false })
      return false
    }
  }

  /**
   * @method popDeletedThingie
   */

  const popDeletedThingie = incoming => {
    const filtered = thingies.value.data.filter(item => item._id !== incoming._id)
    useSetStoreData(thingies, {
      loading: false,
      refresh: false,
      data: filtered
    })
    if (!deleted.value.includes(incoming._id)) {
      deleted.value.push(incoming._id)
    }
  }

  /**
   * @method initThingieUpdate
   * @desc Emits a thingie update to the 'thingies' room using the websocket store socket. If updating the `at` property, the session id is recorded into the update and the thingie is also directly updated in the store rather than waiting for a response over the network.
   */

  const initThingieUpdate = (update, forceViaServer = false) => {
    if (update.hasOwnProperty('at') && !forceViaServer) {
      const updateAt = Object.assign({}, update, {
        omit_session_id: sessionId.value,
        last_update: {
          token: token.value
        }
      })
      socket.value.emit('update-thingie', updateAt)
      updateThingie(updateAt)
    } else {
      socket.value.emit('update-thingie', Object.assign({}, update, {
        last_update: {
          token: token.value
        }
      }))
    }
  }

  /**
   * @method updateThingie
   * @desc Updates a thingie on the current page. If the incoming update has has an omit_session_id key, it is because the update originated from this session. In this case the thingie will be updated and not outright replaced.
   */

  const updateThingie = incoming => {
    const collection = thingies.value.data
    const index = collection.findIndex(item => item._id === incoming._id)
    if (index >= 0) {
      const thingie = collection[index]
      if (incoming.hasOwnProperty('omit_session_id')) {
        delete incoming.omit_session_id
        incoming = Object.assign(thingie, incoming)
      }
      collection.splice(index, 1, incoming)
    }
  }

  /**
   * @method setEditing
   */

  const setEditing = incoming => {
    editing.value = incoming
  }

  /**
   * @method addNewTextThingie
   */

  const addNewTextThingie = coords => {
    // Search for an existing template text thingie
    const newTextId = 'new-text-thingie'
    const newTextThingieIndex = thingies.value.data.findIndex(item => item._id === newTextId)
    // Get position of double click event scaled to scene
    const scaled = { x: (coords.x / sceneData.value.scale) - sceneData.value.x, y: (coords.y / sceneData.value.scale) - sceneData.value.y }
    // If not found, add one to the thingies array
    if (newTextThingieIndex < 0) {
      thingies.value.data.push({
        _id: newTextId,
        verse: verse.value.data.name,
        location: page.value.data.name,
        location_history: [],
        at: {
          x: scaled.x,
          y: scaled.y,
          width: 250,
          height: 120,
          rotation: 0
        },
        zIndex: 1,
        thingie_type: 'text',
        text: '',
        colors: []
      })
      // Set it to the current editing thingie
      setEditing(newTextId)
    } else {
      // If found, remove
      setEditing(false)
      removeNewTextThingie()
    }
  }

  /**
   * @method removeNewTextThingie
   */

  const removeNewTextThingie = () => {
    useSetStoreData(thingies, {
      loading: false,
      refresh: false,
      data: thingies.value.data.filter(item => item._id !== 'new-text-thingie')
    })
  }

  // ==================================================================== return
  return {
    // ----- state
    thingies,
    editing,
    deleted,
    // ----- actions
    getThingies,
    postCreateThingie,
    pushCreatedThingie,
    postDeleteThingie,
    popDeletedThingie,
    initThingieUpdate,
    updateThingie,
    setEditing,
    addNewTextThingie,
    removeNewTextThingie
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCollectorStore, import.meta.hot))
}
