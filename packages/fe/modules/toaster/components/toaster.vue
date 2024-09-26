<template>
  <div :class="['toaster', `from-${from}`]">

    <transition-group :name="`toast-slide-in__${from}`">
      <Toast
        v-for="toast in toasts"
        :key="toast.id"
        :toast="toast"
        :timeout="timeout">

        <template #toast="{ toast }">
          <div :class="['toast', toast.type, { jingle: toast.jingle > 0 }]">
            <div class="icon-container">
              <!-- <IconCheck v-if="toast.type === 'success'" />
              <IconExclamationTriangleFill v-if="toast.type === 'caution'" />
              <IconExclamation v-if="toast.type === 'error'" /> -->
            </div>
            <div class="content" v-html="toast.text" />
          </div>
        </template>

      </Toast>
    </transition-group>

  </div>
</template>

<script setup>
// ======================================================================= Setup
const props = defineProps({
  from: {
    type: [String, Object],
    required: false,
    default: null
  }
})

// ======================================================================== Data
const generalStore = useGeneralStore()
const { siteData } = storeToRefs(generalStore)
const toasterStore = useToasterStore()
const { toasts } = storeToRefs(toasterStore)

const settings = computed(() => siteData.value?.settings?.toaster || {})
const from = computed(() => props.from || settings.value.from || 'top')
const timeout = computed(() => settings.value.timeout || 5000)

</script>

<style lang="scss" scoped>
$padding: 1rem;

// ///////////////////////////////////////////////////////////////////// General
.toaster {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  position: fixed;
  z-index: 100000;
  &.from-top {
    top: $padding;
    left: 50%;
    transform: translateX(-50%);
  }
  &.from-bottom {
    bottom: $padding;
    left: 50%;
    transform: translateX(-50%);
  }
}

/**
 * 💡 these animations should be edited in an external stylesheet and will
 * require the use of `!important`
 */

.toast-slide-in__top {
  &-move,
  &-enter-active,
  &-leave-active {
    transition: all 0.5s ease;
  }
  &-enter-from {
    opacity: 0;
    transform: translateY(-2rem);
  }
  &-leave-to {
    opacity: 0;
  }
}

.toast-slide-in__bottom {
  &-move,
  &-enter-active,
  &-leave-active {
    transition: all 0.5s ease;
  }
  &-enter-from {
    opacity: 0;
    transform: translateY(2rem);
  }
  &-leave-to {
    opacity: 0;
  }
}
</style>
