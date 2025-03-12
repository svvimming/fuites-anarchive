<template>
  <ZeroAlert
    mode="alert"
    alert-id="multiverse-verse-settings-modal">
    <div class="verse-settings-modal">

      <span class="heading">Verse Settings</span>
      <span class="body-text"></span>

      <span class="input-label">Verse name</span>
      <div :class="['input-wrapper', { active: verseName }]">
        <input
          v-model="verseName"
          class="input" />
      </div>
      <!-- ========================================================= Buttons -->
      <div class="button-row">
        <ButtonBasic
          :class="['submit-button']"
          @clicked="submitEditVerse">
          <span>Submit</span>
        </ButtonBasic>
        <ButtonBasic
          :class="['cancel-button']"
          @clicked="emit('close-alert')">
          <span>Cancel</span>
        </ButtonBasic>
      </div>

    </div>
  </ZeroAlert>    
</template>

<script setup>
// ======================================================================= Setup
const props = defineProps({
  verseId: {
    type: [String, Boolean],
    required: false,
    default: false
  }
})

const emit = defineEmits(['close-alert'])

// ======================================================================== Data
const alertStore = useZeroAlertStore()
const verseName = ref('')

// ==================================================================== Watchers
watch(() => props.verseId, (val) => {
  const alert = alertStore.getAlert('multiverse-verse-settings-modal')
  if (val) {
    alertStore.openAlert('multiverse-verse-settings-modal')
  } else if (alert.status === 'open') {
    alertStore.closeAlert('multiverse-verse-settings-modal')
  }
})

// ===================================================================== Methods
const submitEditVerse = () => {
  console.log('submitEditVerse')
}

</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.verse-settings-modal {
  padding: torem(16);
  border-radius: torem(20);
  transition: 300ms ease;
  background-color: $athensGray;
  max-width: torem(460);
  @include modalShadow;
}

// ////////////////////////////////////////////////////////// Modal Form Styling
.heading {
  display: block;
  padding-bottom: torem(18);
  margin-bottom: torem(18);
  width: 100%;
  font-weight: 600;
  font-size: torem(20);
  color: $drippyDark;
  border-bottom: 1px solid rgba(#B2B9CC, 0.5);
}

.body-text {
  display: block;
  font-size: torem(14);
  font-weight: 400;
  color: $drippyDark;
  margin-bottom: torem(18);
}

.input-label {
  display: block;
  font-size: torem(16);
  font-weight: 500;
  color: $drippyDark;
  margin-bottom: torem(10);
}

.input-wrapper {
  position: relative;
  margin-bottom: torem(18);
  width: 100%;
  border-radius: torem(10);
  background-color: #DFE0E5;
  box-shadow: inset 0 2px 4px rgba(#595555, 0.25), inset 0 -2px 0 #F6F7FA;
}

.input {
  width: 100%;
  padding: torem(12) torem(20);
  height: torem(43);
  font-size: torem(16);
  font-weight: 500;
  color: $drippyDark;
}

input::-webkit-input-placeholder {
  color: rgba(#3E3F4D, 0.5);
  font-weight: 500;
}

input::-moz-placeholder {
  color: rgba(#3E3F4D, 0.5);
  font-weight: 500;
}

input::-ms-placeholder {
  color: rgba(#3E3F4D, 0.5);
  font-weight: 500;
}

input::placeholder {
  color: rgba(#3E3F4D, 0.5);
  font-weight: 500;
}

.token-text {
  padding-top: torem(18);
  margin-top: torem(18);
  border-top: 1px solid rgba(#B2B9CC, 0.5);
}

.button-row {
  display: flex;
  :deep(.basic-button) {
    flex-grow: 1;
    &:not(:last-child) {
      margin-right: torem(30);
    }
  }
}

.submit-button {
  background-color: $kellyGreen;
  box-shadow: 0 2px 8px rgba($kellyGreen, 0.5);
}

.cancel-button {
  background-color: $pollyPink;
  box-shadow: 0 2px 8px rgba($pollyPink, 0.5);
}
</style>
