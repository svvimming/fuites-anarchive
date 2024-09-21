// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
// import { ref } from '#imports'
import { v4 } from 'uuid'

// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
export const useGeneralStore = defineStore('general', () => {
  // ===================================================================== state
  const config = useRuntimeConfig()
  const siteData = ref({})
  const sessionId = ref('')

  // ================================================================== computed
  const baseUrl = computed(() => config.public.backendUrl)

  // ===================================================================== Hooks
  onMounted(() => { sessionId.value = v4() })

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
    sessionId,
    // ----- actions
    setSiteData
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useGeneralStore, import.meta.hot))
}
