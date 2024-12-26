// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
import { defineStore } from 'pinia'
import { useFetchAuth } from '../composables/use-fetch-auth'

// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
export const useCollectorStore = defineStore('collector', () => {
  // =================================================================== imports
  const generalStore = useGeneralStore()
  const { sessionId } = storeToRefs(generalStore)
  const verseStore = useVerseStore()
  const { verse, page } = storeToRefs(verseStore)
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
      if (thingie) {
        thingies.value.data.push(thingie)
      }
      useSetStoreData(thingies, { refresh: false })
      return thingie
    } catch (e) {
      useHandleFetchError(e)
      useSetStoreData(thingies, { refresh: false })
    }
  }

  /**
   * @method initThingieUpdate
   * @desc Emits a thinige update to the 'thingies' room using the websocket store socket. If updating the `at` property, the session id is recorded into the update and the thingie is also directly updated in the store rather than waiting for a response over the network.
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

  // ==================================================================== return
  return {
    // ----- state
    thingies,
    editing,
    // ----- actions
    getThingies,
    postCreateThingie,
    initThingieUpdate,
    updateThingie,
    setEditing
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCollectorStore, import.meta.hot))
}
