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

  /**
   * @method updateThingie
   */

  const updateThingie = incoming => {
    const collection = thingies.value.data
    const index = collection.findIndex(item => item._id === incoming._id)
    if (index >= 0) {
      // const thingie = collection[index]
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
