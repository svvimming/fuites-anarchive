// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
import { defineStore } from 'pinia'
import { useFetchAuth } from '../composables/use-fetch-auth'

// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
export const useCollectorStore = defineStore('collector', () => {
  // =================================================================== imports
  const verseStore = useVerseStore()
  const { verse, page } = storeToRefs(verseStore)
  const pocketStore = usePocketStore()
  const { pocket, token } = storeToRefs(pocketStore)

  // ===================================================================== state
  const thingies = ref({
    loading: false,
    refresh: false,
    data: []
  })

  // =================================================================== actions

  /**
   * @method getThingies
   */

  const getThingies = async () => {
    try {
      useSetStoreData(thingies, { loading: true })
      const response = await useFetchAuth('/get-thingies', {
        location: page.value.data.name,
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
    } catch (e) {
      useHandleFetchError(e)
      useSetStoreData(thingies, { refresh: false })
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

  // ==================================================================== return
  return {
    // ----- state
    thingies,
    // ----- actions
    getThingies,
    postCreateThingie,
    updateThingie
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCollectorStore, import.meta.hot))
}
