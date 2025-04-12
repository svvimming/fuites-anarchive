<template>
  <div class="page-invite">
    <div :class="['message', inputMode, { success }]">
      <!-- ========================================================== Loader -->
      <template v-if="inviteStatus === 'loading'">
        <div class="spinner-container">
          <SpinnerTripleDot />
        </div>
      </template>
      <!-- ======================================= Content: [Invite Expired] -->
      <template v-else-if="inviteStatus === 'expired'">
        <div class="expired-container">
          <span class="title text">Invite Expired</span>
          <span class="text">This invite has expired. Please contact the invite sender to get a new invite.</span>
        </div>
      </template>
      <!-- ====================================== Content: [Invite Accepted] -->
      <template v-else-if="inviteStatus === 'accepted'">
        <div class="accepted-container">
          <span class="title text">Invite Accepted</span>
          <span class="text">You've already accepted this invite.</span>
        </div>
      </template>
      <!-- ======================================= Content: [Invite Pending] -->
      <template v-else>
        <!-- ------------------------------------------------ Pending Header -->
        <div class="pending-container">
          <span class="title text">Welcome!</span>
          <div class="invite-description">
            <span class="text">You've been invited to</span>
            <span class="text verse-names">{{ readableVerseNames }}</span>
            <span class="text">on fuit.es. To join, you'll need a token: </span>
          </div>
          <div
            v-if="ctaText"
            :key="ctaText"
            class="cta-message">
            <span class="text">{{ ctaText }}</span>
          </div>
          <div v-if="inputMode === 'uninitialized'" class="button-row">
            <ButtonBasic
              :class="['add-token-button']"
              @clicked="inputMode = 'add-token'">
              <span>Add Token</span>
            </ButtonBasic>
            <ButtonBasic
              :class="['generate-token-button']"
              @clicked="inputMode = 'generate-token'">
              <span>Generate Token</span>
            </ButtonBasic>
          </div>
          <!-- <div v-if="inputMode === 'generate-token'" class="warning-text text">
            Warning! You should copy this token to a safe place. Once you accept, you won't be able to see it again.
          </div> -->
        </div>
        <!-- ------------------------------------------------ Add Token Form -->
        <div
          v-if="inputMode === 'add-token'"
          class="form-container">
          <div :class="['input-wrapper', { active: existingToken }]">
            <input
              v-model="existingToken"
              ref="input"
              type="email"
              autocomplete="off"
              class="input"
              autocapitalize="none"
              placeholder="enter your token" />
          </div>
        </div>
        <!-- ------------------------------------------- Generate Token Form -->
        <div
          v-if="inputMode === 'generate-token'"
          class="form-container generate-form">
          <div :class="['input-wrapper', { active: newToken }]">
            <input
              v-model="newToken"
              ref="input"
              type="email"
              autocomplete="off"
              class="input new-token"
              autocapitalize="none"
              placeholder="create a new token"
              readonly />
          </div>
          <ButtonBasic
            :force-disabled="submitting || success"
            :class="['generate-token-button']"
            @clicked="generateToken">
            <span>Generate</span>
          </ButtonBasic>
          <span :class="['warning-text', { active: newToken }]">
            {{ warningText }}
          </span>
        </div>
        <!-- ------------------------------------------------- Accept Button -->
        <div
          v-if="inputMode !== 'uninitialized' && !success"
          class="button-row finalize">
          <ButtonBasic
            :class="['submit-button', { disabled: disableSubmit }]"
            :force-loading="submitting"
            :force-disabled="disableSubmit"
            @clicked="submitAcceptInvite">
            <span>Accept</span>
          </ButtonBasic>
          <ButtonBasic
            :class="['cancel-button']"
            @clicked="inputMode = 'uninitialized'">
            <span>Cancel</span>
          </ButtonBasic>
        </div>
        <!-- ----------------------------------------------- Success Message -->
        <div v-if="success" class="success-message">
          <span class="text">{{ successMessage }}</span>
          <br>
          <span class="text">Navigate home where you can enter your token and view your verses.</span>
          <div class="button-row success">
            <ButtonBasic
              tag="nuxt-link"
              to="/"
            :class="['home-button']">
              <span>Go Home</span>
            </ButtonBasic>
          </div>
        </div>
      </template>

    </div>
  </div>
</template>

<script setup>
// ======================================================================= Setup
import SettingsData from '@/data/settings.json'

definePageMeta({ layout: 'empty' })

// ======================================================================== Data
const route = useRoute()
const id = route.query.id
const pocketStore = usePocketStore()
const { invite } = storeToRefs(pocketStore)
const { $diceware } = useNuxtApp()

const inputMode = ref('uninitialized')
const existingToken = ref('')
const newToken = ref('')
const submitting = ref(false)
const success = ref(false)

// fetch Invite
await useAsyncData('invite', async () => await pocketStore.getInvite({ invite_id: id }), { server: false })

// ==================================================================== Computed
const inviteVerses = computed(() => invite.value.data?.verses || [])
const inviteStatus = computed(() => invite.value.data?.status || 'loading')
const readableVerseNames = computed(() => {
  const names = inviteVerses.value.map(v => v.name)
  const len = names.length
  return len > 1 ? `${names.slice(0, len - 1).join(', ')} and ${names[len - 1]}` : names[0]
})
const ctaText = computed(() => SettingsData.invitePage.ctaText[inputMode.value])
const warningText = computed(() => SettingsData.invitePage.warningText)
const disableSubmit = computed(() => (inputMode.value === 'add-token' && !existingToken.value) || (inputMode.value === 'generate-token' && !newToken.value))
const successMessage = computed(() => SettingsData.invitePage.successMessage[inputMode.value])
// =================================================================== Methods
/**
 * @method generateToken
 */

const generateToken = async () => {
  newToken.value = await $diceware(3)
}

/**
 * @method submitAcceptInvite
 */

const submitAcceptInvite = async () => {
  if (!['add-token', 'generate-token'].includes(inputMode.value)) { return }
  const token = inputMode.value === 'add-token' ? existingToken.value : newToken.value
  submitting.value = true
  const result = await pocketStore.postAcceptInvite({
    invite_id: id,
    submit_type: inputMode.value,
    token
  })
  console.log('result', result)
  submitting.value = false
  if (result?.status === 'success') {
    success.value = true
  }
}

</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.message {
  position: absolute;
  left: 50%;
  top: 50%;
  width: torem(560);
  padding: torem(24);
  border-radius: torem(20);
  transform: translate(-50%, -50%) scale(0.8);
  transition: 300ms ease;
  background-color: $athensGray;
  // box-shadow: 0 torem(6) torem(10) rgba(0, 0, 0, 0.25);
  @include modalShadow;
  .title {
    display: block;
    font-weight: 600;
    margin-bottom: torem(10);
  }
  .option-button {
    &:first-child {
      margin-right: torem(8);
    }
  }
  &.uninitialized {
    max-height: torem(248);
  }
  &.add-token {
    max-height: torem(300);
    &.success {
      max-height: torem(370);
    }
  }
  &.generate-token {
    max-height: torem(412);
    &.success {
      max-height: torem(500);
    }
  }
  &.add-token,
  &.generate-token {
    .cta-message,
    .form-container,
    .finalize,
    .success-message {
      animation: fadeIn 150ms ease-out 0.3s forwards;
      opacity: 0;
    }
  }
}

.text {
  font-size: torem(16);
  line-height: 1.5;
}

.verse-names {
  font-weight: 600;
  font-style: italic;
  margin: 0 torem(4);
}

.warning-text {
  margin-top: torem(16);
  font-weight: 600;
  color: $pollyPink;
  opacity: 0;
  transition: 150ms ease;
  &.active {
    opacity: 1;
  }
}

.invite-description {
  line-height: 1;
  margin-bottom: torem(24);
}

.cta-message {
  line-height: 1;
}

.cta-message,
.button-row,
.form-container {
  padding: 0 torem(16);
}

.cta-message {
  .text {
    font-weight: 500;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

// ////////////////////////////////////////////////////////////////////// Inputs
.form-container {
  margin-top: torem(18);
}

.generate-form {
  display: flex;
  flex-direction: column;
  align-items: center;
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

.new-token {
  font-family: 'Courier Prime', monospace;
  text-align: center;
}

.button-row {
  display: flex;
  margin-top: torem(24);
  :deep(.basic-button) {
    flex-grow: 1;
    &:not(:last-child) {
      margin-right: torem(30);
    }
  }
  &.success {
    justify-content: center;
    :deep(.basic-button) {
      flex-grow: 0;
      display: block;
      width: fit-content;
    }
  }
}

.submit-button {
  background-color: $kellyGreen !important;
  box-shadow: 0 2px 8px rgba($kellyGreen, 0.5);
  &.disabled {
    background-color: rgba($gullGray, 0.5) !important;
    box-shadow: 0 2px 8px rgba($gullGray, 0.5);
    pointer-events: none;
  }
}

.cancel-button {
  background-color: $pollyPink !important;
  box-shadow: 0 2px 8px rgba($pollyPink, 0.5);
}

.success-message {
  text-align: center;
  margin-top: torem(32);
}
</style>
