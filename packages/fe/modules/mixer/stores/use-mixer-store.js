// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
import { defineStore } from 'pinia'

// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
export const useMixerStore = defineStore('mixer', () => {
  // =================================================================== imports
  const alertStore = useZeroAlertStore()
  // ===================================================================== state
  const audioContext = ref(false)
  const mixer = ref(false)
  const analyser = ref(false)
  const mediaRecorder = ref(false)
  const recording = ref({
    path: [],
    id: null,
    audioBuffer: null,
    playbackSource: false,
    playbackAnalyser: false,
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
   * @method resetRecording
   * @desc Resets the recording object to its initial state
   */

   const resetRecording = () => {
    mediaRecorder.value = false
    recording.value = {
      path: [],
      id: null,
      audioBuffer: null,
      playbackSource: false,
      state: 'waiting'
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
    
    if (state === 'recording') {
      // Create a MediaStreamDestination node to capture the mixer output
      const destination = audioContext.value.createMediaStreamDestination()
      mixer.value.connect(destination)
      
      // Initialize MediaRecorder with the destination stream
      mediaRecorder.value = new MediaRecorder(destination.stream)
      
      // Set up data collection
      const chunks = []
      mediaRecorder.value.ondataavailable = (e) => {
        chunks.push(e.data)
      }
      
      // Handle recording completion
      mediaRecorder.value.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/ogg; codecs=opus' })
        console.log('blob', blob)
        recording.value.audioBuffer = blob
        // Open the create sound thingie alert after recording is stopped and the blob is created
        alertStore.openAlert('create-sound-thingie-alert')
      }
      // Start recording
      mediaRecorder.value.start()

    } else if (state === 'complete' && mediaRecorder.value) {
      // Stop the recording
      mediaRecorder.value.stop()
    }
  }

  /**
   * @method playRecording
   * @desc Plays back the recorded audio buffer
   * @returns {Promise} A promise that resolves when the audio has finished playing
   */
  const playRecording = async () => {
    if (!recording.value.audioBuffer) {
      console.warn('No audio buffer available to play')
      return
    }

    // Pause the current audio context
    audioContext.value.suspend()
    // Create an audio source from the blob
    const recordingAudioCtx = new AudioContext()
    const arrayBuffer = await recording.value.audioBuffer.arrayBuffer()
    const audioBuffer = await recordingAudioCtx.decodeAudioData(arrayBuffer)
    
    // Create and connect the source
    const source = recordingAudioCtx.createBufferSource()
    source.buffer = audioBuffer
    source.loop = true // Enable infinite looping
    source.connect(recordingAudioCtx.destination)
    
    // Store the source for later stopping
    recording.value.playbackSource = source
    recording.value.playbackAnalyser = recordingAudioCtx.createAnalyser()
    source.connect(recording.value.playbackAnalyser)
    // Play the audio
    source.start(0)
    
    // Return a promise that resolves when the audio finishes playing
    return new Promise(resolve => {
      source.onended = resolve
    })
  }

  /**
   * @method stopPlayback
   * @desc Stops the current playback of the recorded audio
   */
  const stopPlayback = () => {
    if (recording.value.playbackSource) {
      // stop the recording playback
      recording.value.playbackSource.stop()
      recording.value.playbackAnalyser.disconnect()
      recording.value.playbackSource = false
      recording.value.playbackAnalyser = false
    }
    if (audioContext.value) {
      // resume the page audio context
      audioContext.value.resume()
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
    resetRecording,
    playRecording,
    stopPlayback
  }
})
