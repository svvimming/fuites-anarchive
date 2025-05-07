<template>
  <div ref="ctn" :class="['caddy-link-editor', { active }]">

    <ButtonCaddy
      :class="['tiny-button', { open: linkEditorOpen }]"
      tool="link-editor"
      @clicked="linkEditorOpen = !linkEditorOpen">
      <IconLink class="icon" />
    </ButtonCaddy>

    <div
      :class="['input-wrapper', { active: linkEditorOpen }, { error: urlError }]">
      <input
        v-model="url"
        ref="input"
        autocomplete="off"
        autocapitalize="none"
        placeholder="Enter a url"
        :class="['input', 'courier']"
        @keyup.enter="submit" />
    </div>

  </div>
</template>

<script setup>
// ===================================================================== Imports
import { onClickOutside } from '@vueuse/core'

// ======================================================================= Setup
const props = defineProps({
  initialUrl: {
    type: String,
    default: '',
    required: false
  },
  active: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['update-link'])

// ======================================================================== Data
const linkEditorOpen = ref(false)
const ctn = ref(null)
const input = ref(null)
const url = ref('')
const urlError = ref(false)
const { isValidUrl } = useValidateUrl()

onClickOutside(ctn, () => {
  if (linkEditorOpen.value) {
    submit()
  }
})

// ==================================================================== Watchers
watch(() => props.active, (val) => {
  if (val) {
    url.value = props.initialUrl
  }
})

watch(linkEditorOpen, (val) => {
  if (val) {
    input.value.focus()
  }
})

// ===================================================================== Methods
const submit = () => {
  if (url.value === '') {
    emit('update-link', '')
    linkEditorOpen.value = false
    return
  }
  if (isValidUrl(url.value)) {
    urlError.value = false
    emit('update-link', url.value)
    linkEditorOpen.value = false
  } else {
    urlError.value = true
  }
}

</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.caddy-link-editor {
  position: absolute;
  width: torem(32) !important;
  height: torem(32) !important;
  z-index: 4 !important;
  opacity: 0;
  visibility: hidden;
  transition: opacity 150ms ease, visibility 150ms ease;
  &.active {
    opacity: 1;
    visibility: visible;
  }
}

.tiny-button {
  width: torem(32);
  height: torem(32);
  background-color: $shark;
  border-radius: 50%;
  border: solid torem(3) $stormGray;
  transition: 150ms ease;
  .icon {
    transition: 150ms ease;
    transform: scale(0.9);
  }
  &:hover {
    background-color: #3f424d;
    .icon {
      transform: scale(1);
    }
  }
  &.open {
    background-color: #3f424d;
    .icon {
      transform: scale(1);
    }
  }
}

// /////////////////////////////////////////////////////////////// Input Wrapper
.input-wrapper {
  position: absolute;
  display: flex;
  padding-right: torem(14);
  left: 100%;
  top: calc(50% + torem(1));
  z-index: 1;
  opacity: 0;
  visibility: hidden;
  border-radius: torem(20);
  background-color: white;
  padding: torem(4) torem(14);
  box-shadow: 0px 0px 3px 1px $lavender;
  transform: translate(torem(4), -50%);
  transition: opacity 200ms ease, transform 200ms ease, visibility 200ms ease;
  &:before {
    content: '';
    position: absolute;
    width: 0;
    height: 0;
    top: 50%;
    right: 100%;
    border-top: torem(5) solid transparent;
    border-bottom: torem(5) solid transparent;
    border-right: torem(5) solid rgba($lavender, 0.5);
    transform: translateY(-50%);
  }
  &:after {
    content: '* Must be a valid URL!';
    position: absolute;
    top: calc(100% + torem(3));
    right: 50%;
    font-size: torem(8);
    color: $contessa;
    opacity: 0;
    transition: 150ms ease;
    transform: translateX(50%);
  }
  &.active {
    opacity: 1;
    visibility: visible;
    transform: translate(torem(8), -50%);
    transition-delay: 10ms;
  }
  &.error {
    &:after {
      opacity: 1;
    }
  }
}

.input {
  font-size: torem(14);
  line-height: 1.5;
  font-weight: 500;
  letter-spacing: 0.1em;
  opacity: 1;
  transition: 150ms ease;
  color: $woodsmoke;
}
</style>
