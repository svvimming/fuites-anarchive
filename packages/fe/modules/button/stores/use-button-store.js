// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
import { defineStore } from 'pinia'

// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
export const useButtonStore = defineStore('button', () => {
  // ===================================================================== state
  const buttons = ref({})

  // =================================================================== actions

  /**
   * @method setButton
   */

  const setButton = (payload) => {
    buttons.value[payload.id] = payload
  }

  /**
   * @method removeButton
   */

  const removeButton = (id) => {
    delete buttons.value[id]
  }

  // ==================================================================== return
  return {
    // ----- state
    buttons,
    // ----- actions
    setButton,
    removeButton
  }
})
