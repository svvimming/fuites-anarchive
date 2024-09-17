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
      console.log(e)
      // useHandleFetchError(e, [], [403])
      useSetStoreData(thingies, {
        loading: false,
        refresh: false,
        data: []
      })
      return thingies.value
    }
  }

  // ==================================================================== return
  return {
    // ----- state
    thingies,
    // ----- actions
    getThingies
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCollectorStore, import.meta.hot))
}
