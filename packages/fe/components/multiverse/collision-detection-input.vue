<template>
  <div class="collision-detection-input">

    <span :class="['input-label', { error }]">{{ labelText }}</span>

    <div :class="['input-wrapper', { active: modelValue, error }]">
      <input
        v-model="modelValue"
        @input="handleInput"
        autocomplete="off"
        class="input"
        autocapitalize="none"
        :placeholder="placeholder" />
      <span v-if="error" class="error-message">{{ error }}</span>
    </div>

  </div>
</template>

<script setup>
// ====================================================================== Import
import { useChangeCase } from '@vueuse/integrations/useChangeCase'
import { useDebounceFn } from '@vueuse/core'

// ======================================================================= Setup
const props = defineProps({
  labelText: {
    type: String,
    required: true
  },
  placeholder: {
    type: String,
    required: false,
    default: ''
  },
  inputId: {
    type: String,
    required: true
  },
  checkCollision: {
    type: String,
    required: true,
    default: 'verse',
    validator: (value) => {
      return ['token', 'verse', 'page'].includes(value)
    }
  },
  collisionMode: {
    type: String,
    required: true,
    default: 'exclude',
    validator: (value) => {
      return ['include', 'exclude'].includes(value)
    }
  }
})

const emit = defineEmits(['validation'])

// ======================================================================== Data
const verseStore = useVerseStore()
const pocketStore = usePocketStore()
const { token } = storeToRefs(pocketStore)
const error = ref('')
const modelValue = ref('')
const isChecking = ref(false)
const messages = {
  token: {
    include: 'The token submitted must match the current session token',
    exclude: 'This token is already in use',
    case: 'Token must be in kebab-case format (e.g., "my-nice-token")'
  },
  verse: {
    include: 'A verse with this name already exists',
    exclude: 'A verse with this name already exists',
    case: 'Verse name must be in kebab-case format (e.g., "my-verse-name")'
  },
  page: {
    include: 'This page exists',
    exclude: 'A page with this name already exists',
    case: 'Page name must be in kebab-case format (e.g., "my-page-name")'
  }
}
// ===================================================================== Methods
// Debounce the validation check to avoid too many API calls
const debouncedCheck = useDebounceFn(async (value) => {
  if (!value) {
    error.value = ''
    emit('validation', { inputId: props.inputId, isValid: false, value })
    return
  }

  const kebabCase = useChangeCase(value, 'kebabCase').value
  if (kebabCase !== value) {
    error.value = messages[props.checkCollision].case
    emit('validation', { inputId: props.inputId, isValid: false, value })
    return
  }

  isChecking.value = true
  let collision = false
  switch (props.checkCollision) {
    case 'token':
      collision = await pocketStore.checkTokenExists(kebabCase)
      break
    case 'verse':
      collision = await verseStore.checkVerseExists(kebabCase)
      break
    case 'page':
      collision = await verseStore.checkPageExists(kebabCase)
      break
  }
  isChecking.value = false

  const result = props.collisionMode === 'include' ? !collision : collision

  if (result) {
    error.value = messages[props.checkCollision][props.collisionMode]
    emit('validation', { inputId: props.inputId, isValid: false, value })
  } else {
    error.value = ''
    emit('validation', { inputId: props.inputId, isValid: true, value })
  }
}, 500)

const handleInput = (e) => {
  const value = e.target.value
  debouncedCheck(value)
}

const getInputValue = () => {
  return modelValue.value
}

defineExpose({ getInputValue })

</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.collision-detection-input {
  margin-bottom: torem(18);
}

.input-label {
  display: block;
  font-size: torem(16);
  font-weight: 500;
  color: $drippyDark;
  margin-bottom: torem(10);
  &.error {
    color: $pollyPink;
  }
}

.input-wrapper {
  position: relative;
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

.error-message {
  position: absolute;
  bottom: torem(-20);
  left: torem(20);
  font-size: torem(12);
  color: $pollyPink;
  font-weight: 500;
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
</style> 
