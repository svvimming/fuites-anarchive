<template>
  <ZeroAlert
    mode="modal"
    alert-id="create-sound-thingie-alert"
    :class="['create-sound-thingie-alert']">
    <div class="message">
      <span class="title text">Create Sound Thingie</span>
      <span class="prompt text">Are you happy with the path you just drew?</span>
      <div class="sound-path-preview">
        <svg
          v-if="path"
          width="100%"
          height="100%"
          viewBox="0 0 200 200"
          xmlns="http://www.w3.org/2000/svg"
          class="svg-path-preview"
          :style="{ opacity }">
          <path
            :d="path"
            fill="none"
            :stroke="recording.color"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round" />
        </svg>
      </div>
      <div class="button-row">
        <ButtonBasic
          :force-disabled="recording.uploadStatus === 'uploading'"
          :force-loading="recording.uploadStatus === 'uploading'"
          class="confirm-button"
          @clicked="handleConfirm">
          <span class="text">Yes, Create<br>Sound Thingie</span>
        </ButtonBasic>
        <ButtonBasic
          :force-disabled="recording.uploadStatus === 'uploading'"
          class="cancel-button"
          @clicked="handleCancel">
          <span class="text">No, Try again</span>
        </ButtonBasic>
      </div>
    </div>
  </ZeroAlert>
</template>

<script setup>
// ======================================================================== Data
const mixerStore = useMixerStore()
const { recording } = storeToRefs(mixerStore)
const alertStore = useZeroAlertStore()
const path = ref('')
const { normalizePathData } = useTransformPathData()
const audioBufferArray = ref(false)
const requestId = ref(false)
const opacity = ref(0)

// ==================================================================== Computed
const open = computed(() => alertStore.getAlert('create-sound-thingie-alert')?.status === 'open')
const playbackAnalyser = computed(() => recording.value.playbackAnalyser)

// ===================================================================== Watchers
watch(open, (value) => {
  if (value) {
    // playback the sound thingie just created
    mixerStore.playRecording()
    // get the path data from the recording
    const normalized = normalizePathData(recording.value.path, {
      containerMax: 200,
      centerPath: true
    })
    // convert the path data to an svg path
    path.value = useGetSvgPath(normalized.join(' '), { closed: false }) || ''
  }
})

watch(playbackAnalyser, (value) => {
  if (value) {
    initAudioBufferArray()
    calculateOutputLevel()
  }
})

// ===================================================================== Methods
/**
 * @method handleConfirm
 */

const handleConfirm = () => {
  mixerStore.initUploadRecording()
  mixerStore.stopRecordingPlayback()
  if (requestId.value) {
    cancelAnimationFrame(requestId.value)
    audioBufferArray.value = false
    opacity.value = 0
  }
}

/**
 * @method handleCancel
 */

const handleCancel = () => {
  alertStore.closeAlert('create-sound-thingie-alert')
  mixerStore.stopRecordingPlayback()
  mixerStore.resetRecording()
  if (requestId.value) {
    cancelAnimationFrame(requestId.value)
    audioBufferArray.value = false
    opacity.value = 0
  }
}

/**
 * @method initAudioBufferArray
 */

 const initAudioBufferArray = () => {
  if (!playbackAnalyser.value) return
  const bufferLength = playbackAnalyser.value.frequencyBinCount
  audioBufferArray.value = new Uint8Array(bufferLength)
}

/**
 * @method calculateOutputLevel
 */

const calculateOutputLevel = () => {
  if (!playbackAnalyser.value || !audioBufferArray.value) return
  playbackAnalyser.value.getByteFrequencyData(audioBufferArray.value)
  let sum = 0
  for (const amplitude of audioBufferArray.value) {
    sum += amplitude * amplitude
  }
  opacity.value = 0.025 * Math.sqrt(sum / audioBufferArray.value.length)
  requestId.value = requestAnimationFrame(calculateOutputLevel)
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.message {
  position: absolute;
  left: 50%;
  top: 50%;
  padding: torem(16);
  border-radius: torem(20);
  transform: translate(-50%, -50%) scale(0.8);
  transition: 300ms ease;
  background-color: $athensGray;
  @include modalShadow;
  width: torem(382);
  
  .title {
    font-weight: 600;
    margin-bottom: torem(10);
  }
  
  .prompt {
    margin-bottom: torem(20);
  }
  
  .text {
    display: block;
    font-size: torem(14);
    line-height: 1.5;
  }
}

.sound-path-preview {
  padding: torem(20) torem(42);
  margin-bottom: torem(20);
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: torem(4);
  @include focusBoxShadowSmall;
}

.svg-path-preview {
  overflow: visible;
}

.button-row {
  display: flex;
  justify-content: center;
  gap: torem(10);
  width: 100%;
  margin-top: torem(10);
}

.confirm-button,
.cancel-button {
  flex-grow: 1;
  min-width: torem(120);
}

</style>
