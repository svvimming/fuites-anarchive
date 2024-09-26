<template>
  <div class="toast-container">

    <slot name="toast" :toast="toast" />

  </div>
</template>

<script setup>
// ======================================================================= Setup
const props = defineProps({
  toast: {
    type: Object,
    required: true
  },
  timeout: {
    type: Number,
    required: false,
    default: 5000
  }
})

// ======================================================================== Data
const toasterStore = useToasterStore()
const toastTimeout = props.toast.timeout || props.timeout
const toastTimer = ref(null)

// ===================================================================== Methods
/**
 * @method unToast
 */

const unToast = () => {
  toastTimer.value = setTimeout(() => {
    toasterStore.removeMessage(props.toast.id)
    clearTimeout(toastTimer.value)
  }, toastTimeout)
}

// ======================================================================== Data
watch(() => props.toast.jingle, jingle => {
  if (jingle > 0) {
    clearTimeout(toastTimer.value)
    unToast()
    setTimeout(() => {
      toasterStore.updateToast(props.toast.id, {
        jingle: 0
      })
    }, 100)
  }
})

// ======================================================================= Hooks
onMounted(() => { unToast() })
</script>
