<template>
  <ZeroAlert
    mode="alert"
    alert-id="pluriverse-create-verse-alert">

    <div class="alert-message">
      <!-- ========================================================= Heading -->
      <span class="heading">Create a new Verse</span>
      <span class="body-text">Choose a name for your new partition (aka Verse) and a name for its first page. This name will be used to identify the Verse in the URL and can't be changed once the Verse is created!</span>
      <!-- ====================================================== Verse Name -->
      <PluriverseCollisionDetectionInput
        label-text="Verse name"
        placeholder="enter new verse name"
        input-id="create-verse-name-input"
        check-collision="verse"
        collision-mode="exclude"
        @validation="handleInputValidation" />
      <!-- ======================================================= Page Name -->
      <span class="input-label">Page name</span>
      <div class="input-wrapper">
        <input
          ref="pageNameInputRef"
          autocomplete="off"
          class="input"
          autocapitalize="none"
          placeholder="enter first page name"
          @input="handlePageNameInput" />
      </div>
      <span
        v-if="errorMessage.code === 'page-name-collision'"
        class="error-message">
        {{ errorMessage.message }}
      </span>
      <!-- =========================================================== Token -->
      <span class="body-text token-text">Enter your token to finalize creation of the new Verse. The token submitted must match the current session token.</span>
      <div class="input-wrapper">
        <input
          ref="tokenInputRef"
          autocomplete="off"
          class="input"
          autocapitalize="none"
          placeholder="enter token"
          @input="handleTokenInput" />
      </div>
      <span
        v-if="errorMessage.code === 'token-mismatch'"
        class="error-message">
        {{ errorMessage.message }}
      </span>
      <!-- ========================================================= Buttons -->
      <div class="button-row">
        <ButtonBasic
          :force-loading="pocket.refresh"
          :force-disabled="!formValid || pocket.refresh"
          class="submit-button"
          @clicked="submitCreateVerse">
          <span>Submit</span>
        </ButtonBasic>
        <ButtonBasic
          class="cancel-button"
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
const { pocket } = storeToRefs(pocketStore)

const pageNameInputRef = ref(null)
const tokenInputRef = ref(null)
const formData = ref({
  'create-verse-name-input': false,
  'create-verse-page-input': false,
  'create-verse-token-input': false
})
const formValid = ref(false)
const errorMessage = ref({})

// ===================================================================== Methods
const handleInputValidation = data => {
  formData.value[data.inputId] = data
  formValid.value = validateForm()
}

const validateForm = () => {
  const isValid = Object.values(formData.value).every(data => data?.isValid)
  return isValid
}

const handlePageNameInput = (event) => {
  const sanitized = event.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '')
  if (sanitized !== event.target.value) {
    event.target.value = sanitized
  }
  handleInputValidation({
    inputId: 'create-verse-page-input',
    isValid: sanitized.length > 0,
    value: sanitized
  })
}

const handleTokenInput = (event) => {
  const sanitized = event.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '')
  if (sanitized !== event.target.value) {
    event.target.value = sanitized
  }
  handleInputValidation({
    inputId: 'create-verse-token-input',
    isValid: sanitized.length > 0,
    value: sanitized
  })
}

const submitCreateVerse = async () => {
  // if the current token matches the submitted token and verse name is valid, proceed
  if (validateForm()) {
    const verseName = formData.value['create-verse-name-input'].value
    const firstPageName = formData.value['create-verse-page-input'].value
    const submittedToken = formData.value['create-verse-token-input'].value
    const created = await pocketStore.postCreateVerse({
      verseName: useChangeCase(verseName, 'kebabCase').value,
      firstPageName: useChangeCase(firstPageName, 'kebabCase').value,
      token: submittedToken
    })
    if (created?.status === 'success') {
      errorMessage.value = {}
      emit('close-alert')
    } else if (created?.status === 'error') {
      errorMessage.value = created
    }
  }
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
  &.disabled {
    pointer-events: none;
    background-color: $gullGray;
    box-shadow: none;
  }
}

.cancel-button {
  background-color: $pollyPink;
  box-shadow: 0 2px 8px rgba($pollyPink, 0.5);
}

.error-message {
  display: block;
  font-size: torem(14);
  font-weight: 500;
  color: $pollyPink;
  transform: translateY(torem(-16));
}
</style>
