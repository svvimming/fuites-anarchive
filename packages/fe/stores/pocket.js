// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
// import { ref } from '#imports'

// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
export const usePocketStore = defineStore('pocket', () => {
  // ===================================================================== state
  const pocketOpen = ref(false)

  // =================================================================== actions

  /**
   * @method setPocketOpen
   */

  const setPocketOpen = val => {
    pocketOpen.value = val
  }

  // ==================================================================== return
  return {
    // ----- state
    pocketOpen,
    // ----- actions
    setPocketOpen
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePocketStore, import.meta.hot))
}
