// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
import { v4 } from 'uuid'

// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
export const useGeneralStore = defineStore('general', () => {
  // =================================================================== imports
  const toasterStore = useToasterStore()
  const pocketStore = usePocketStore()

  // ===================================================================== state
  const config = useRuntimeConfig()
  const siteData = ref({})
  const authenticated = ref(true) /** @TODO set default to false */
  const sessionId = ref('')

  // ================================================================== computed
  const baseUrl = computed(() => config.public.backendUrl)

  // ===================================================================== Hooks
  onMounted(() => { sessionId.value = v4() })

  // =================================================================== actions

  /**
   * @method authenticate
   */

  const authenticate = async token => {
    try {
      const response = await useFetchAuth('/authenticate', { method: 'get', token })
      const authenticated = response.data.payload
      toasterStore.addMessage({
        type: authenticated ? 'success' : 'error',
        text: response.data.message
      })
      if (authenticated) {
        pocketStore.getPocket(token)
        authenticated.value = authenticated
      }
    } catch (e) {
      useHandleFetchError(e)
    }
  }
  
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
    authenticated,
    sessionId,
    // ----- actions
    setSiteData
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useGeneralStore, import.meta.hot))
}
