// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
import { defineStore } from 'pinia'
import { useFetchAuth } from '../composables/use-fetch-auth'

// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
export const useCollectorStore = defineStore('collector', () => {
  // ===================================================================== state
  const thingies = ref({
    loading: true,
    refresh: false,
    data: []
  })

  // =================================================================== actions

  /**
   * @method getThingies
   */

  const getThingies = async incoming => {
    try {
      const response = await useFetchAuth('/get-thingies', {
        locations: ['pocket', incoming.page],
        verse: incoming.verse,
        method: 'get'
      })
      useSetStoreData(thingies, {
        loading: false,
        refresh: false,
        data: response
      })
      return thingies.value
    } catch (e) {
      useHandleFetchError(e)
      useSetStoreData(thingies, {
        loading: false,
        refresh: false,
        data: []
      })
      return thingies.value
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
    updateThingie
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCollectorStore, import.meta.hot))
}
