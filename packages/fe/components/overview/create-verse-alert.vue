<template>
  <ZeroAlert
    mode="modal"
    alert-id="overview-create-verse-alert">

    <div class="alert-message">
      <span class="title text">Create a new Verse</span>
      <span class="prompt text">Give your new partition a name and create a page to start with.</span>
      
      <div :class="['input-wrapper', { active: verseName }]">
        <input
          v-model="verseName"
          autocomplete="off"
          class="input"
          autocapitalize="none"
          placeholder="New verse name" />
      </div>

      <div :class="['input-wrapper', { active: pageName }]">
        <input
          v-model="pageName"
          ref="input"
          autocomplete="off"
          class="input"
          autocapitalize="none"
          placeholder="First page name" />
      </div>

      <span class="prompt text">Add your token to finalize creation of the new Verse. The token submitted must match the current session token.</span>

      <div :class="['input-wrapper', { active: tokenValue }]">
        <input
          v-model="tokenValue"
          ref="input"
          autocomplete="off"
          class="input"
          autocapitalize="none"
          placeholder="Enter token" />
      </div>

      <div class="button-row">
        <ButtonBasic
          :force-loading="pocket.refresh"
          :force-disabled="pocket.refresh"
          :class="['link', 'portal-link', 'submit', { active: !!verseName && !!tokenValue }]"
          @clicked="submitCreateVerse">
          Submit
        </ButtonBasic>
        <ButtonBasic
          @clicked="alertStore.closeAlert('overview-create-verse-alert')">
          Cancel
        </ButtonBasic>
      </div>
    </div>

  </ZeroAlert>
</template>

<script setup>
// ====================================================================== Import
import { useChangeCase } from '@vueuse/integrations/useChangeCase'

// ======================================================================== Data
const alertStore = useZeroAlertStore()
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
      alertStore.closeAlert('overview-create-verse-alert')
    }
  }
  /** @TODO - add incorrect token error states */
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.alert-message {
  position: absolute;
  left: 50%;
  top: 50%;
  padding: torem(16);
  border-radius: torem(20);
  transform: translate(-50%, -50%) scale(0.8);
  transition: 300ms ease;
  background-color: $athensGray;
  max-width: torem(460);
  @include modalShadow;
  .title {
    font-weight: 600;
  }
  .title,
  .prompt {
    margin-bottom: torem(10);
  }
  .text {
    display: block;
    font-size: torem(12);
    line-height: 1.5;
  }
}

.button-row {
  display: flex;
  margin-top: torem(24);
}

// ////////////////////////////////////////////////////////////////////// Inputs
.input-wrapper {
  flex-grow: 1;
  margin: torem(8) torem(16);
  position: relative;
  width: 75%;
  &:after {
    content: '';
    position: absolute;
    width: 100%;
    height: 1px;
    left: 0;
    bottom: -2px;
    background-color: rgba(0, 0, 0, 0.5);
    border-radius: 50%;
    opacity: 0;
    transition: 200ms ease;
  }
  &:hover {
    &:after {
      opacity: 0.7;
      width: calc(100% + 1rem);
      left: -0.5rem;
    }
  }
  &.active {
    &:after {
      opacity: 0.7;
    }
  }
}

.input {
  width: 100%;
  height: 2rem;
  font-size: torem(16);
  font-weight: 700;
  letter-spacing: 0.1em;
}

input::-webkit-input-placeholder {
  color: rgba($woodsmoke, 0.5);
}

input::-moz-placeholder {
  color: rgba($woodsmoke, 0.5);
}

input::-ms-placeholder {
  color: rgba($woodsmoke, 0.5);
}

input::placeholder {
  color: rgba($woodsmoke, 0.5);
}

.submit {
  margin-right: torem(8);
  text-align: left;
  opacity: 0.5;
  pointer-events: none;
  &.active {
    opacity: 1;
    pointer-events: all;
  }
}
</style>
