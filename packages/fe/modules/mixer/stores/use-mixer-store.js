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
   * @method toggleAudioContextPlayState
   */

  const toggleAudioContextPlayState = () => {
    if (audioContext.value) {
      const state = audioContext.value.state
      if (state === 'suspended') {
        audioContext.value.resume()
      } else if (state === 'running') {
        state.audioContext.suspend()
      }
    }
  }

  // ==================================================================== return
  return {
    // ----- state
    audioContext,
    // ----- actions
    createAudioContext,
    toggleAudioContextPlayState
  }
})
