<template>
  <ZeroAlert
    mode="alert"
    alert-id="multiverse-verse-settings-modal">
    <div class="verse-settings-modal">
      <!-- ========================================================= Heading -->
      <span class="heading">{{ `Settings for '${verse?.name}'` }}</span>
      <span class="input-label">{{ `Give a token access to ${verse?.name}` }}</span>
      <!-- ===================================================== Token Input -->
      <div class="input-row">
        <div :class="['input-wrapper', { error: tokenAddError }]">
          <input
            v-model="tokenToAdd"
            autocomplete="off"
            class="input"
            autocapitalize="none"
            placeholder="add a token" />
          <span
            v-if="tokenAddMessage"
            :class="['feedback-message', { error: tokenAddError }]">
            {{ tokenAddMessage }}
          </span>
        </div>
        <ButtonBasic
          :class="['add-token-button']"
          @clicked="submitAddToken">
          <span>Add</span>
        </ButtonBasic>
      </div>
      <!-- ========================================================= Buttons -->
      <div class="button-row">
        <ButtonBasic
          :class="['cancel-button']"
          @clicked="emit('close-alert')">
          <span>Close</span>
        </ButtonBasic>
      </div>

    </div>
  </ZeroAlert>    
</template>

<script setup>
// ======================================================================= Setup
const props = defineProps({
  verse: {
    type: Object,
    required: false,
    default: false
  }
})

const emit = defineEmits(['close-alert'])

// ======================================================================== Data
const alertStore = useZeroAlertStore()
const pocketStore = usePocketStore()
const tokenToAdd = ref('')
const tokenAddMessage = ref('')
const tokenAddError = ref(false)

// ==================================================================== Watchers
watch(() => props.verse?._id, (val) => {
  const alert = alertStore.getAlert('multiverse-verse-settings-modal')
  if (val) {
    alertStore.openAlert('multiverse-verse-settings-modal')
  } else if (alert.status === 'open') {
    alertStore.closeAlert('multiverse-verse-settings-modal')
  }
})

// ===================================================================== Methods
const submitAddToken = async() => {
  tokenAddMessage.value = ''
  tokenAddError.value = false
  const result = await pocketStore.postAddVerseToToken({
    verseId: props.verse._id,
    targetToken: tokenToAdd.value
  })
  const type = result.type
  if (type === 'verse-added-to-token') {
    tokenAddMessage.value = 'Success!'
  } else if (type === 'token-not-found') {
    tokenAddMessage.value = 'This token doesn\'t exist, try another'
    tokenAddError.value = true
  } else if (type === 'token-already-has-access') {
    tokenAddMessage.value = 'This token already has access to this verse'
    tokenAddError.value = true
  }
}

</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.verse-settings-modal {
  padding: torem(16);
  border-radius: torem(20);
  transition: 300ms ease;
  background-color: $athensGray;
  min-width: torem(360);
  max-width: torem(460);
  @include modalShadow;
}

.input-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: torem(18);
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
  margin-right: torem(10);
  width: 100%;
  border-radius: torem(10);
  background-color: #DFE0E5;
  box-shadow: inset 0 2px 4px rgba(#595555, 0.25), inset 0 -2px 0 #F6F7FA;
  &.error {
    .input {
      color: $pollyPink;
    }
  }
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

.add-token-button {
  margin-bottom: torem(2);
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

.cancel-button {
  background-color: $pollyPink;
  box-shadow: 0 2px 8px rgba($pollyPink, 0.5);
}

.feedback-message {
  position: absolute;
  bottom: torem(-20);
  left: torem(20);
  font-size: torem(12);
  color: $kellyGreen;
  font-weight: 500;
  &.error {
    color: $pollyPink;
  }
}
</style>
