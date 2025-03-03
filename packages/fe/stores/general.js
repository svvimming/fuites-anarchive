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
  const mouseOverScene = ref(false)
  const activeModes = ref({
    portals: true,
    audio: false,
    explore: false,
    tooltips: false
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
   * @method setMouseOverScene
   */

  const setMouseOverScene = incoming => {
    mouseOverScene.value = incoming 
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
    mouseOverScene,
    activeModes,
    // ----- actions
    setSiteData,
    setDragndrop,
    setDraggingThingie,
    setMouseOverScene,
    toggleMode
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useGeneralStore, import.meta.hot))
}
