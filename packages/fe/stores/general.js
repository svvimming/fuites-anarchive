// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
// import { ref } from '#imports'

// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
export const useGeneralStore = defineStore('general', () => {
  // ===================================================================== state
  const config = useRuntimeConfig()
  const siteData = ref({})

  // ================================================================== computed
  const baseUrl = computed(() => config.public.backendUrl)

  // =================================================================== actions
  /**
   * @method setSiteData
   */

  const setSiteData = incoming => {
    siteData.value[incoming.key] = incoming.value
  }

  // ==================================================================== return
  return {
    // ----- state
    baseUrl,
    siteData,
    // ----- actions
    setSiteData
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useGeneralStore, import.meta.hot))
}
