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
  const recording = ref({
    path: [],
    id: null,
    audioBuffer: null,
    state: 'waiting'
  })

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

  /**
   * @method addToRecordingPath
   * @desc Adds x and y coordinates to the recording path array in a flat format
   * @param {number} x - The x coordinate
   * @param {number} y - The y coordinate
   */

  const addToRecordingPath = (x, y) => {
    recording.value.path.push(x, y)
  }

  /**
   * @method setRecordingState
   * @desc Sets the state of the recording
   * @param {string} state - The new state ('waiting', 'recording', or 'complete')
   */

  const setRecordingState = state => {
    recording.value.state = state
  }

  /**
   * @method resetRecording
   * @desc Resets the recording object to its initial state
   */

  const resetRecording = () => {
    recording.value = {
      path: [],
      id: null,
      audioBuffer: null,
      state: 'waiting'
    }
  }

  // ==================================================================== return
  return {
    // ----- state
    audioContext,
    mixer,
    analyser,
    recording,
    // ----- actions
    createAudioContext,
    setAudioContextPlayState,
    addToRecordingPath,
    setRecordingState,
    resetRecording
  }
})
