// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
import { useBelowSmall } from './use-below-small'

// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
export const useTouchCapable = () => {
  // ====================================================================== Data
  const isTouch = ref(false)

  // MatchMedia refs (initialized on mount to avoid SSR issues)
  const mqls = ref([])

  // =================================================================== Methods
  /**
   * @method computeIsTouch
   * Prefer reliable feature detection, fall back to screen-size heuristic.
   */
  const { small } = useBelowSmall()

  const computeIsTouch = () => {
    // 1) Primary: navigator.maxTouchPoints (widely supported, reliable)
    const byNavigator = typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0

    // 2) Secondary: pointer/hover media queries
    let byMediaQueries = false
    if (typeof window !== 'undefined' && 'matchMedia' in window) {
      const anyPointerCoarse = window.matchMedia('(any-pointer: coarse)').matches
      const hoverNone = window.matchMedia('(hover: none)').matches
      const pointerCoarse = window.matchMedia('(pointer: coarse)').matches
      byMediaQueries = anyPointerCoarse || (hoverNone && pointerCoarse)
    }

    // 3) Legacy fallback: ontouchstart / DocumentTouch (older Safari/Android)
    const byLegacy = typeof window !== 'undefined' && (
      'ontouchstart' in window || (window.DocumentTouch && document instanceof window.DocumentTouch)
    )

    // 4) Final fallback: your existing small-screen heuristic
    if (byNavigator || byMediaQueries || byLegacy) return true
    return small.value
  }

  const update = () => { isTouch.value = computeIsTouch() }

  // ===================================================================== Hooks
  onMounted(() => {
    update()

    // Listen for changes to relevant media queries
    if (typeof window !== 'undefined' && 'matchMedia' in window) {
      const queries = ['(any-pointer: coarse)', '(hover: none)', '(pointer: coarse)']

      const attach = (mql) => {
        const handler = () => update()
        // Safari <= 13 uses addListener/removeListener
        if ('addEventListener' in mql) {
          mql.addEventListener('change', handler)
          mql.__handler = handler
        } else if ('addListener' in mql) {
          mql.addListener(handler)
          mql.__handler = handler
        }
        return mql
      }

      mqls.value = queries.map(q => attach(window.matchMedia(q)))
    }

    // Also react when the small-screen fallback changes
    watch(small, () => update(), { flush: 'post' })
  })

  onBeforeUnmount(() => {
    // Clean up media query listeners
    mqls.value.forEach((mql) => {
      if (!mql || !mql.__handler) return
      if ('removeEventListener' in mql) {
        mql.removeEventListener('change', mql.__handler)
      } else if ('removeListener' in mql) {
        mql.removeListener(mql.__handler)
      }
      delete mql.__handler
    })
  })

  // ==================================================================== Return
  return { isTouch }
}


