<template>
  <ZeroAlert
    mode="alert"
    alert-id="multiverse-create-verse-alert">

    <div class="alert-message">
      <!-- ========================================================= Heading -->
      <span class="heading">Create a new Verse</span>
      <span class="body-text">Choose a name for your new partition (aka Verse) and a name for its first page:</span>
      <!-- ====================================================== Verse Name -->
      <span class="input-label">Verse name</span>
      <div :class="['input-wrapper', { active: verseName }]">
        <input
          v-model="verseName"
          autocomplete="off"
          class="input"
          autocapitalize="none"
          placeholder="enter new verse name" />
      </div>
      <!-- ======================================================= Page Name -->
      <span class="input-label">Page name</span>
      <div :class="['input-wrapper', { active: pageName }]">
        <input
          v-model="pageName"
          ref="input"
          autocomplete="off"
          class="input"
          autocapitalize="none"
          placeholder="enter first page name" />
      </div>
      <!-- =========================================================== Token -->
      <span class="body-text token-text">Enter your token to finalize creation of the new Verse. The token submitted must match the current session token.</span>
      <span class="input-label">Token</span>
      <div :class="['input-wrapper', { active: tokenValue }]">
        <input
          v-model="tokenValue"
          ref="input"
          autocomplete="off"
          class="input"
          autocapitalize="none"
          placeholder="Enter token" />
      </div>
      <!-- ========================================================= Buttons -->
      <div class="button-row">
        <ButtonBasic
          :force-loading="pocket.refresh"
          :force-disabled="pocket.refresh"
          :class="['submit-button', { active: !!verseName && !!tokenValue }]"
          @clicked="submitCreateVerse">
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
// ====================================================================== Import
import { useChangeCase } from '@vueuse/integrations/useChangeCase'

const emit = defineEmits(['close-alert'])
// ======================================================================== Data
const pocketStore = usePocketStore()
const { pocket, token } = storeToRefs(pocketStore)

const verseName = ref('')
const pageName = ref('')
const tokenValue = ref('')

// ===================================================================== Methods
const submitCreateVerse = async () => {
  const sanitized = tokenValue.value.replaceAll(' ', '-').split('-').filter(word => word !== '-').map(word => word.toLowerCase())
  const joined = sanitized.join('-')
  // if the current token matches the submitted token, proceed
  if (joined === token.value) {
    const created = await pocketStore.postCreateVerse({
      verseName: useChangeCase(verseName.value, 'kebabCase').value,
      firstPageName: useChangeCase(pageName.value, 'kebabCase').value
    })
    if (created) {
      emit('close-alert')
    }
  }
  /** @TODO - add incorrect token error states */
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.alert-message {
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
