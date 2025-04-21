// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
import { useThrottleFn } from '@vueuse/core'

// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
export const useBelowSmall = () => {
  // ====================================================================== Data
  const small = ref(false)
  const resizeEventListener = ref(null)

  // =================================================================== Methods
  /**
   * @method checkSmallBreakpoint
   */

  const checkSmallBreakpoint = () => {
    if (window.matchMedia('(max-width: 53.125rem)').matches) {
      if (!small.value) {
        small.value = true
      }
    } else {
      if (small.value) {
        small.value = false
      }
    }
  }

  // ===================================================================== Hooks
  onMounted(() => {
    resizeEventListener.value = useThrottleFn(() => { checkSmallBreakpoint() }, 25)
    window.addEventListener('resize', resizeEventListener.value)
    checkSmallBreakpoint()
  })

  onBeforeUnmount(() => {
    if (resizeEventListener.value) {
      window.removeEventListener('resize', resizeEventListener.value)
    }
  })

  // ==================================================================== Return
  return { small }
}
