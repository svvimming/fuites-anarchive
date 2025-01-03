// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
import { defineStore } from 'pinia'

// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
export const useMixerStore = defineStore('mixer', () => {

  // ===================================================================== state
  const audioContext = ref(false)  

  // =================================================================== actions
  /**
   * @method createAudioContext
   */

  const createAudioContext = () => {
    audioContext.value = new AudioContext()
  }

  /**
   * @method setAudioContextPlayState
   */

  const setAudioContextPlayState = val => {
    if (val) {
      audioContext.value.resume()
    } else {
      audioContext.value.suspend()
    }
  }

  // ==================================================================== return
  return {
    // ----- state
    audioContext,
    // ----- actions
    createAudioContext,
    setAudioContextPlayState
  }
})
