// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
import { v4 } from 'uuid'

// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
export const useGeneralStore = defineStore('general', () => {
  // ===================================================================== state
  const config = useRuntimeConfig()
  const siteData = ref({})
  const sessionId = ref('')
  const dragndrop = ref(false)
  const draggingThingie = ref(false)
  const modal = ref({
    active: false,
    action: ''
  })
  const activeModes = ref({
    'portals': true,
    'sounds': false,
    'traces': false,
    'drippy': true
  })

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

  /**
   * @method setModal
   */

  const setModal = incoming => {
    modal.value = incoming
  }

  /**
   * @method closeModal
   */

  const closeModal = () => {
    modal.value.active = false
  }

  /**
   * @method setDragndrop
   */

  const setDragndrop = incoming => {
    dragndrop.value = incoming
  }

  /**
   * @method setDraggingThingie
   */

  const setDraggingThingie = incoming => {
    draggingThingie.value = incoming
  }

  /**
   * @method toggleMode
   */

  const toggleMode = key => {
    activeModes.value[key] = !activeModes.value[key]
  }

  // ==================================================================== return
  return {
    // ----- state
    baseUrl,
    siteData,
    sessionId,
    dragndrop,
    draggingThingie,
    modal,
    activeModes,
    // ----- actions
    setSiteData,
    setModal,
    closeModal,
    setDragndrop,
    setDraggingThingie,
    toggleMode
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useGeneralStore, import.meta.hot))
}
