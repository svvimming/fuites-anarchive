// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
import { v4 } from 'uuid'
import { useBelowSmall } from '@/composables/use-below-small'

// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
export const useGeneralStore = defineStore('general', () => {
  // ===================================================================== state
  const config = useRuntimeConfig()
  const { small } = useBelowSmall()
  const siteData = ref({})
  const sessionId = ref('')
  const dragndrop = ref(false)
  const portalEditing = ref(false)
  const draggingThingie = ref(false)
  const mouseOverScene = ref(false)
  const activeModes = ref({
    portals: true,
    audio: false,
    explore: false,
    tooltips: false,
    record: false,
    mobileEdit: false,
    externalLinks: true
  })

  // ================================================================== Computed
  const baseUrl = computed(() => config.public.backendUrl)

  // ================================================================== Watchers
  watch(() => activeModes.value.record, (val) => {
    if (val && !activeModes.value.audio) {
      setMode('audio', true)
    }
  })

  watch(small, (val) => {
    if (!val) { setMode('mobileEdit', false) }
  })

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
   * @method setPortalEditing
   */

  const setPortalEditing = incoming => {
    portalEditing.value = incoming
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

  /**
   * @method setMode
   */

  const setMode = (key, val) => {
    activeModes.value[key] = val
  }

  // ==================================================================== return
  return {
    // ----- state
    baseUrl,
    siteData,
    sessionId,
    dragndrop,
    portalEditing,
    draggingThingie,
    mouseOverScene,
    activeModes,
    small,
    // ----- actions
    setSiteData,
    setDragndrop,
    setPortalEditing,
    setDraggingThingie,
    setMouseOverScene,
    toggleMode,
    setMode
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useGeneralStore, import.meta.hot))
}
