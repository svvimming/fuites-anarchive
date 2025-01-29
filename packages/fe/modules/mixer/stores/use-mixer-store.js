// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
import { defineStore } from 'pinia'

// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
export const useMixerStore = defineStore('mixer', () => {

  // ===================================================================== state
  const audioContext = ref(false)
  const mixer = ref(false)
  const analyser = ref(false)

  // =================================================================== actions
  /**
   * @method createAudioContext
   */

  const createAudioContext = () => {
    audioContext.value = new AudioContext()
    mixer.value = audioContext.value.createGain()
    analyser.value = audioContext.value.createAnalyser()
    mixer.value.connect(analyser.value)
    analyser.value.connect(audioContext.value.destination)
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
    mixer,
    analyser,
    // ----- actions
    createAudioContext,
    setAudioContextPlayState
  }
})
