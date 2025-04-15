<template>
  <ZeroAlert
    mode="alert"
    alert-id="multiverse-verse-settings-modal">
    <div class="verse-settings-modal">
      <!-- ========================================================= Heading -->
      <span class="heading">{{ `Settings for '${verse?.name}'` }}</span>
      <span class="input-label">{{ `Generate an invite link for ${verse?.name}` }}</span>
      <!-- ===================================================== Token Input -->
      <div class="input-row">
        <div class="input-wrapper">
          <input
            v-model="inviteUrl"
            autocomplete="off"
            class="input"
            autocapitalize="none"
            placeholder="generate an invite link"
            readonly />
          <!-- <span
            v-if="tokenAddMessage"
            :class="['feedback-message', { error: tokenAddError }]">
            {{ tokenAddMessage }}
          </span> -->
        </div>
        <ButtonBasic
          v-if="!inviteUrl"
          :force-loading="generating"
          :force-disabled="generating"
          :class="['add-token-button', { disabled: generating }]"
          @clicked="submitGenerateInvite">
          <span>Generate</span>
        </ButtonBasic>
        <ButtonBasic
          v-else-if="isSupported"
          :class="['copy-button']"
          @clicked="copy(inviteUrl)">
          <span>{{ copied ? 'Copied!' : 'Copy' }}</span>
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
// ===================================================================== Imports
import { useClipboard } from '@vueuse/core'

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
const inviteUrl = ref('')
const generating = ref(false)
const { copy, copied, isSupported } = useClipboard({ source: inviteUrl })

// ==================================================================== Watchers
watch(() => props.verse?._id, (val) => {
  const alert = alertStore.getAlert('multiverse-verse-settings-modal')
  if (val) {
    inviteUrl.value = ''
    generating.value = false
    alertStore.openAlert('multiverse-verse-settings-modal')
  } else if (alert.status === 'open') {
    alertStore.closeAlert('multiverse-verse-settings-modal')
  }
})

// ===================================================================== Methods
const submitGenerateInvite = async() => {
  generating.value = true
  const result = await pocketStore.postGenerateInvite({
    verses: props.verse.name
  })
  if (result) {
    inviteUrl.value = result.url
  }
  generating.value = false
}

</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.verse-settings-modal {
  padding: torem(16);
  border-radius: torem(20);
  transition: 300ms ease;
  background-color: $athensGray;
  min-width: torem(500);
  max-width: torem(560);
  @include modalShadow;
}

.input-row {
  display: flex;
  flex-direction: column;
  align-items: center;
  // justify-content: space-between;
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
  margin-bottom: torem(10);
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
  &.disabled {
    pointer-events: none;
  }
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
