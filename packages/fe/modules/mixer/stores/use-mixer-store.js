// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
import { defineStore } from 'pinia'
import { useTransformPathData } from '../../../composables/use-transform-path-data'
import AudioBufferToWav from 'audiobuffer-to-wav'

// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
export const useMixerStore = defineStore('mixer', () => {
  // ===================================================================== setup
  const alertStore = useZeroAlertStore()
  const collectorStore = useCollectorStore()
  const { thingies } = storeToRefs(collectorStore)
  const pocketStore = usePocketStore()
  const { token } = storeToRefs(pocketStore)
  const verseStore = useVerseStore()
  const { page } = storeToRefs(verseStore)
  const websocketStore = useWebsocketStore()
  const { socket } = storeToRefs(websocketStore)
  const generalStore = useGeneralStore()
  const { calculatePathRanges, normalizePathData } = useTransformPathData()

  const { $bus } = useNuxtApp()

  // ===================================================================== state
  const audioContext = ref(false)
  const mixer = ref(false)
  const analyser = ref(false)
  const mediaRecorder = ref(false)
  const recording = ref({
    path: [],
    id: null,
    audioBlob: null,
    playbackSource: false,
    playbackAnalyser: false,
    color: '#000',
    state: 'waiting',
    uploadProgress: 0,
    uploadStatus: 'waiting',
    fileId: null
  })

  // Upload related refs
  const fileReader = ref(null)
  const nextChunkPayload = ref(null)
  const place = ref(0)
  const goal = ref(0)
  const lastRecordingBufferData = ref(null)
  const recordingAudioCtx = ref(null)

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
      audioBlob: null,
      playbackSource: false,
      color: '#000',
      state: 'waiting',
      uploadProgress: 0,
      uploadStatus: 'waiting',
      fileId: null
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
        const blob = new Blob(chunks, { type: 'audio/mpeg' })
        recording.value.audioBlob = blob
        // Open the create sound thingie alert after recording is stopped and the blob is created
        alertStore.openAlert('create-sound-thingie-alert')
      }
      // Start recording
      mediaRecorder.value.start()
      // Get a color for the new recording sound path
      recording.value.color = getRecordingColor()
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
    if (!recording.value.audioBlob) {
      console.warn('No audio buffer available to play')
      return
    }
    // Pause the current audio context
    audioContext.value.suspend()
    // Create an audio source from the blob
    recordingAudioCtx.value = new AudioContext()
    const arrayBuffer = await recording.value.audioBlob.arrayBuffer()
    const audioBuffer = await recordingAudioCtx.value.decodeAudioData(arrayBuffer)
    // Create and connect the source
    const source = recordingAudioCtx.value.createBufferSource()
    source.buffer = audioBuffer
    source.loop = true // Enable infinite looping
    source.connect(recordingAudioCtx.value.destination)
    
    // Store the source for later stopping
    recording.value.playbackSource = source
    recording.value.playbackAnalyser = recordingAudioCtx.value.createAnalyser()
    source.connect(recording.value.playbackAnalyser)
    // Play the audio
    source.start(0)
    // Return a promise that resolves when the audio finishes playing
    return new Promise(resolve => {
      source.onended = resolve
    })
  }

  /**
   * @method stopRecordingPlayback
   * @desc Stops the current playback of the recorded audio
   */
  const stopRecordingPlayback = () => {
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

  /**
   * @method getRecordingColor
   * @desc Gets the color of the last thingie updated by the current user. Uses client side thingies array to avoid extra server call
   * @returns {string} Color in hex format
   */
  const getRecordingColor = () => {
    const lastThingie = thingies.value.data
      .filter(item => item.last_update.token === token.value)
      .reduce((latest, current) => {
        if (!latest || !latest.last_update) return current
        if (!current.last_update) return latest
        return current.last_update.timestamp > latest.last_update.timestamp ? current : latest
      }, null)
    return lastThingie?.colors[0] || '#000'
  }

  /**
   * @method cutAudioBlobToLength
   * @desc Cuts the audio blob to the length of the last recording
   * @param {Blob} blob - The audio blob to cut
   * @param {object} bufferData - The buffer data of the last recording
   * @returns {Blob} A new audio blob
   */

  const cutAudioBlobToLength = async (blob, bufferData) => {
    // Get the array buffer of the old blob and create a new empty buffer
    const audioCtx = new AudioContext()
    const arrayBuffer = await blob.arrayBuffer()
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
    const newAudioBuffer = audioCtx.createBuffer(
      bufferData.numberOfChannels,
      bufferData.length,
      bufferData.sampleRate,
    )
    // Copy the old buffer data to the new buffer
    for (let channel = 0; channel < newAudioBuffer.numberOfChannels; channel++) {
      const oldBufferChannel = audioBuffer.getChannelData(channel)
      const newBufferChannel = newAudioBuffer.getChannelData(channel)
      for (let i = 0; i < newAudioBuffer.length; i++) {
        newBufferChannel[i] = oldBufferChannel[i] || 0
      }
    }
    // Create and connect the source
    const source = recordingAudioCtx.value.createBufferSource()
    source.buffer = newAudioBuffer
    source.loop = true // Enable infinite looping
    source.connect(recordingAudioCtx.value.destination)
    // Store the source for later stopping
    recording.value.playbackSource.stop()
    recording.value.playbackAnalyser.disconnect()
    recording.value.playbackSource = source
    recording.value.playbackAnalyser = recordingAudioCtx.value.createAnalyser()
    source.connect(recording.value.playbackAnalyser)
    // Play the audio
    source.start(0)
    // Create an OfflineAudioContext to render the newAudioBuffer to WAV
    const offlineCtx = new OfflineAudioContext(
      newAudioBuffer.numberOfChannels,
      newAudioBuffer.length,
      newAudioBuffer.sampleRate
    )
    // Create a buffer source with the newAudioBuffer
    const offlineSource = offlineCtx.createBufferSource()
    offlineSource.buffer = newAudioBuffer
    offlineSource.connect(offlineCtx.destination)
    offlineSource.start(0)
    // Render the audio to a wav blob
    return offlineCtx.startRendering()
      .then(renderedBuffer => {
        const wavBuffer = AudioBufferToWav(renderedBuffer)
        return new Blob([wavBuffer], { type: 'audio/wav' })
      })
      .catch(error => {
        console.error('Error rendering audio:', error)
        return null
      })
  }

  /**
   * @method initUploadRecording
   * @desc Initiates the upload of the recorded audio to the server
   */
  const initUploadRecording = async (options = {}) => {
    if (!recording.value.audioBlob) {
      console.warn('No audio buffer available to upload')
      return
    }
    // If enabled, cut the audio blob to the length of the last recording
    if (options.cutToLength && lastRecordingBufferData.value) {
      const blob = await cutAudioBlobToLength(recording.value.audioBlob, lastRecordingBufferData.value)
      if (blob) {
        recording.value.audioBlob = blob
      }
    }
    // update the upload status
    recording.value.uploadStatus = 'uploading'
    // save the sample length of the current buffer
    const buffer = recording.value.playbackSource.buffer
    lastRecordingBufferData.value = {
      numberOfChannels: buffer.numberOfChannels,
      sampleRate: buffer.sampleRate,
      length: buffer.length
    }
    // get the blob and filename
    const blob = recording.value.audioBlob
    const filename = `recording-${Date.now()}`
    const filesize = blob.size
    const mimetype = blob.type
    // Initialize the upload
    socket.value.emit('module|file-upload-initialize|payload', {
      socket_id: socket.value.id,
      uploader_id: 'audio-recording',
      filename,
      filesize,
      mimetype
    })
  }

  /**
   * @method uploadNextChunk
   * @desc Handles uploading the next chunk of the audio file
   * @param {Object} data - Chunk upload data from server
   */
  const uploadNextChunk = data => {
    if (!recording.value.fileId) {
      recording.value.fileId = data.file_id
    }

    place.value = data.place
    goal.value = data.goal
    const chunksize = data.chunksize
    const index = place.value * chunksize
    const chunk = recording.value.audioBlob.slice(index, index + Math.min(chunksize, (recording.value.audioBlob.size - index)))

    recording.value.uploadProgress = ((place.value / goal.value) * 100).toFixed(0)

    nextChunkPayload.value = {
      socket_id: socket.value.id,
      uploader_id: 'audio-recording',
      file_id: recording.value.fileId,
      file_ext: data.file_ext,
      place: place.value,
      goal: goal.value
    }

    fileReader.value.readAsArrayBuffer(chunk)
  }

  /**
   * @method handleUploadComplete
   * @desc Handles the completion of the audio upload
   */
  const handleUploadComplete = async () => {
    // reset the upload progress
    recording.value.uploadProgress = 100
    place.value = 0
    nextChunkPayload.value = null

    // calculate sound thingie at and path data
    const rect = calculatePathRanges(recording.value.path)
    const normalized = normalizePathData(recording.value.path, { containerMax: 200, centerPath: true })
    const strokeWidth = (200 / Math.max(rect.xRange, rect.yRange)) * 10
    // create the sound thingie
    await collectorStore.postCreateThingie({
      file_id: recording.value.fileId,
      thingie_type: 'sound',
      path_data: normalized.join(' '),
      location: page.value.data.name,
      colors: [recording.value.color],
      stroke_width: strokeWidth,
      at: {
        x: rect.minX + (rect.xRange / 2),
        y: rect.minY + (rect.yRange / 2),
        width: rect.xRange,
        height: rect.xRange, // height = width because the path container is square
        rotation: 0
      }
    })
    // set the recording upload status to complete
    recording.value.uploadStatus = 'complete'
    // reset the recording
    alertStore.closeAlert('create-sound-thingie-alert')
    generalStore.setMode('record', false)
    resetRecording()
  }

  /**
   * @method setupFileUpload
   * @desc Sets up the file reader and socket listeners for file upload
   * @param {Object} websocket - The websocket instance
   */
  const setupFileUpload = websocket => {
    fileReader.value = new FileReader()
    fileReader.value.onload = (e) => {
      websocket.emit('module|file-upload-chunk|payload', Object.assign(nextChunkPayload.value, { chunk: e.target.result }))
    }
    websocket.on('audio-recording|file-upload-chunk|payload', uploadNextChunk)
    websocket.on('audio-recording|file-upload-complete|payload', handleUploadComplete)
  }

  /**
   * @method downloadRecordingAsWav
   * @desc Downloads the recorded audio buffer as an WAV file
   */
  const downloadRecordingAsWav = () => {
    if (!recording.value.playbackSource) {
      console.warn('No playback source available to download')
      return
    }
    // Get the buffer data from the playback source
    const buffer = recording.value.playbackSource.buffer
    // Create an OfflineAudioContext to render the newAudioBuffer to WAV
    const offlineCtx = new OfflineAudioContext(
      buffer.numberOfChannels,
      buffer.length,
      buffer.sampleRate
    )
    // Create a buffer source with the newAudioBuffer
    const offlineSource = offlineCtx.createBufferSource()
    offlineSource.buffer = buffer
    offlineSource.connect(offlineCtx.destination)
    offlineSource.start(0)
    // Render the audio and convert to WAV
    offlineCtx.startRendering()
      .then(renderedBuffer => {
        const wavBuffer = AudioBufferToWav(renderedBuffer)
        const blob = new Blob([wavBuffer], { type: 'audio/wav' })
        // Download file
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `sound-thingie-${Date.now()}.wav`
        a.click()
        // Cleanup: revoke the blob URL and remove the anchor element
        setTimeout(() => {
          window.URL.revokeObjectURL(url)
          if (a.parentNode) {
            a.parentNode.removeChild(a)
          }
        }, 1000) // Delay to ensure download starts
      })
      .catch(error => {
        console.error('Error rendering audio:', error)
        stopRecordingPlayback()
        resetRecording()
      })
      .finally(() => {
        // Cleanup: close the offline audio context
        if (offlineCtx.state !== 'closed') {
          offlineCtx.close()
        }
        stopRecordingPlayback()
        resetRecording()
        alertStore.closeAlert('create-sound-thingie-alert')
        generalStore.setMode('record', false)
      })
  }

  // ==================================================================== Socket
  // Add socket connection handler
  $bus.$on('socket.io-connected', setupFileUpload)

  // Remove socket connection handler
  onBeforeUnmount(() => {
    $bus.$off('socket.io-connected', setupFileUpload)
  })

  // ==================================================================== return
  return {
    // ----- state
    audioContext,
    mixer,
    analyser,
    recording,
    lastRecordingBufferData,
    // ----- actions
    createAudioContext,
    setAudioContextPlayState,
    addToRecordingPath,
    setRecordingState,
    resetRecording,
    playRecording,
    stopRecordingPlayback,
    initUploadRecording,
    downloadRecordingAsWav
  }
})
