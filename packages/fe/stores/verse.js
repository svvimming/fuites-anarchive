// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
// import { ref } from '#imports'

// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
export const useVerseStore = defineStore('verse', () => {
  // ===================================================================== state
  // add a variable

  // =================================================================== actions

  /**
   * @method doSomething
   */

  // const doSomething = () => {}

  // ==================================================================== return
  return {
    // ----- state
    // ----- actions
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useVerseStore, import.meta.hot))
}
