<template>
  <div class="auth-container">
    <!-- ============================================================ Prompt -->
    <span class="heading">{{ heading}}</span>
    <span class="body-text">{{ message }}</span>
    <!-- ============================================================= Input -->
    <span class="input-label">Token</span>

    <div class="input-wrapper">
      <input
        ref="inputRef"
        autocomplete="off"
        class="input"
        autocapitalize="none"
        placeholder="enter your token"
        @keyup.enter="submit"
        @input="handleTokenInput" />
    </div>

    <!-- =========================================================== Buttons -->
    <div class="button-row">
      <ButtonBasic
        class="submit-button"
        @click="submit">
        <span>Submit</span>
      </ButtonBasic>
      <ButtonBasic
        :class="['cancel-button']"
        @click="emit('cancel-authentication')">
        <span>Cancel</span>
      </ButtonBasic>
    </div>

  </div>
</template>

<script setup>
// ======================================================================= Setup
defineProps({
  heading: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  }
})
const emit = defineEmits(['authenticate-success', 'cancel-authentication'])

// ======================================================================== Data
const pocketStore = usePocketStore()
const { pocket } = storeToRefs(pocketStore)
const inputRef = ref(null)

// ===================================================================== Methods
const handleTokenInput = (event) => {
  const sanitized = event.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '')
  if (sanitized !== event.target.value) {
    event.target.value = sanitized
  }
}

const submit = async () => {
  const token = inputRef.value.value
  await pocketStore.getAuthPocket({ token })
  if (pocket.value.authenticated) {
    emit('authenticate-success')
    if (process.client) {
      localStorage.setItem('fuitesAnarchiveAuthToken', token)
    }
  }
  inputRef.value.value = ''
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.auth-container {
  padding: torem(16);
  min-width: torem(350);
  border-radius: torem(20);
  background-color: $athensGray;
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
  background-color: $kellyGreen !important;
  box-shadow: 0 2px 8px rgba($kellyGreen, 0.5);
}

.cancel-button {
  background-color: $pollyPink !important;
  box-shadow: 0 2px 8px rgba($pollyPink, 0.5);
}

</style>
