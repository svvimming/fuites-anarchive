<template>
  <div :class="['alert', `mode__${mode}`, { open }]">

    <slot
      :close-alert="closeAlert"
      :data="data" />

  </div>
</template>

<script setup>
// ======================================================================= Props
const props = defineProps({
  alertId: {
    type: String,
    required: true
  },
  mode: {
    type: String,
    default: 'alert', // 'alert' or 'modal'
    required: false
  }
})

// ======================================================================= Setup
const emit = defineEmits(['completed'])

const alertStore = useZeroAlertStore()
alertStore.setAlert({
  id: props.alertId,
  status: 'closed'
})

// ==================================================================== Computed
const alert = computed(() => alertStore.getAlert(props.alertId))
const open = computed(() => alert.value?.status === 'open')
const data = computed(() => alert.value?.data)

// ======================================================================= Hooks
onBeforeUnmount(() => {
  alertStore.removeAlert(props.alertId)
})

// ===================================================================== Methods
/**
 * @method closeAlert
 */
const closeAlert = () => {
  alertStore.closeAlert(props.alertId)
}
</script>

<style lang="scss" scoped>
.alert {
  &.mode__modal {
    position: absolute;
    visibility: hidden;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    transition: 300ms ease;
    z-index: 2;
    &:before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba($woodsmoke, 0.8);
    }
    &.open {
      visibility: visible;
      opacity: 1;
      .message {
        transform: translate(-50%, -50%) scale(1);
      }
    }
  }
}
</style>
