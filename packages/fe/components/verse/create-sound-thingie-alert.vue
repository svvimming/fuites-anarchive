<template>
  <ZeroAlert
    mode="modal"
    alert-id="create-sound-thingie-alert"
    :class="['create-sound-thingie-alert']">
    <div class="message">
      <span class="title text">Create Sound Thingie</span>
      <span class="prompt text">Are you happy with the path you just drew?</span>
      <div class="sound-path-preview">
        <svg v-if="path" width="100%" height="100%" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path :d="path" fill="none" stroke="black" stroke-width="2" />
        </svg>
      </div>
      <div class="button-row">
        <ButtonBasic
          class="confirm-button"
          @clicked="handleConfirm">
          Yes, create sound thingie
        </ButtonBasic>
        <ButtonBasic
          class="cancel-button"
          @clicked="handleCancel">
          No, try again
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
const { normalizePathData } = useNormalizePathData()

// ==================================================================== Computed
const open = computed(() => alertStore.getAlert('create-sound-thingie-alert')?.status === 'open')

// ===================================================================== Watchers
watch(open, (value) => {
  if (value) {
    // playback the sound thingie just created
    mixerStore.playRecording()
    // get the path data from the recording
    const normalized = normalizePathData(recording.value.path, {
      outputMinX: 0,
      outputMaxX: 200,
      outputMinY: 0,
      outputMaxY: 200
    })
    // convert the path data to an svg path
    path.value = useGetSvgPath(normalized.join(' '), { closed: false }) || ''
  }
})

// ===================================================================== Methods
/**
 * @method handleConfirm
 */

const handleConfirm = () => {
  // TODO: Handle sound thingie creation
  // mixerStore.setRecordingState('waiting')
  console.log('handleConfirm')
}

/**
 * @method handleCancel
 */

const handleCancel = () => {
  alertStore.closeAlert('create-sound-thingie-alert')
  mixerStore.stopPlayback()
  mixerStore.resetRecording()
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
  }
  
  .title,
  .prompt {
    margin-bottom: torem(10);
  }
  
  .text {
    display: block;
    font-size: torem(14);
    line-height: 1.5;
  }
}

.sound-path-preview {
  width: 100%;
  height: 100%;
  margin-bottom: torem(10);
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
  min-width: torem(120);
}

</style>
