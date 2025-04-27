<template>
  <ZeroAlert
    mode="modal"
    alert-id="create-sound-thingie-alert"
    :class="['create-sound-thingie-alert']">
    <div class="message">
      <span class="title text">Create Sound Thingie</span>
      <span class="prompt text">Are you happy with the path you just drew?</span>
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
const alertStore = useZeroAlertStore()
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
  mixerStore.resetRecording()
  alertStore.closeAlert('create-sound-thingie-alert')
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
